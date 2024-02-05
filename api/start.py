import os
import logging
import argparse
from gevent.pywsgi import WSGIServer
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix
from flask import Flask, Blueprint
from flask_cors import CORS
from demo import glog, error
from app.utils import StackdriverJsonFormatter
from app.api.document import create_document_processing_api
from app.api.figure import create_figure_processing_api
from app.api.db import create_app_db_api


def create_readiness_check_api() -> Blueprint:
    api = Blueprint("readiness_check", __name__)

    @api.route("/")
    def index() -> tuple[str, int]:
        return "", 204

    return api


def create_app() -> ProxyFix:
    # If LOG_FORMAT is "google:json" emit log message as JSON in a format Google Cloud can parse.
    fmt = os.getenv("LOG_FORMAT")
    handlers = [glog.Handler()] if fmt == "google:json" else []
    level = os.environ.get("LOG_LEVEL", default=logging.INFO)
    logging.basicConfig(level=level, handlers=handlers)

    app = Flask(__name__)
    CORS(app)

    app.app_context().push()

    app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

    api_prefix = "/backendapi"
    app.register_blueprint(
        create_document_processing_api(),
        url_prefix=api_prefix + "/document"
    )
    app.register_blueprint(
        create_figure_processing_api(),
        url_prefix=api_prefix + "/figure"
    )
    app.register_blueprint(
        create_app_db_api(app),
        url_prefix=api_prefix + "/db"
    )
    app.register_blueprint(
        create_readiness_check_api(),
        url_prefix="/"
    )
    app.register_error_handler(HTTPException, error.handle)

    # Use the X-Forwarded-* headers to set the request IP, host and port. Technically there
    # are two reverse proxies in deployed environments, but we "hide" the reverse proxy deployed
    # as a sibling of the API by forwarding the X-Forwarded-* headers rather than chaining them.
    return ProxyFix(app, x_for=1, x_proto=1, x_host=1, x_port=1)


def start():
    """
    Starts up a HTTP server attached to the provider port, and optionally
    in development mode (which is ideal for local development but unideal
    for production use).
    """
    parser = argparse.ArgumentParser(description="Starts your application\"s HTTP server.")
    parser.add_argument(
        "--port",
        "-p",
        help="The port to listen on",
        default=8000
    )
    args = parser.parse_args()

    # We change a few things about the application"s behavior depending on this
    # value. If it"s set to "production" we:
    #
    #   1. Emit JSON serialized logs
    #   2. Use a "production-class" WSGI server
    #   3. Don"t watch the filesystem for code changes
    #
    # If the value is anything other than "production" settings are applied
    # that are appropriate when working locally. The biggest change being that
    # Flask watches the source code for changes and restarts automatically
    # when they occur.
    #
    # We default to `"production"` as that"s what Flask does:
    # https://flask.palletsprojects.com/en/2.0.x/config/#environment-and-debug-features
    env = os.getenv("FLASK_ENV", "production")

    # Locally we don"t specify any handlers, which causes `basicConfig` to set
    # up one for us that writes human readable messages.
    handlers = None

    # If we're in production we setup a handler that writes JSON log messages
    # in a format that Google likes.
    is_prod = env == "production"
    if is_prod:
        json_handler = logging.StreamHandler()
        json_handler.setFormatter(StackdriverJsonFormatter())
        handlers = [ json_handler ]

    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", default=logging.INFO),
        handlers=handlers
    )
    logger = logging.getLogger()

    app = Flask(__name__)
    CORS(app)

    app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

    # Bind the API functionality to our application. You can add additional
    # API endpoints by editing api.py.
    logger.debug("Starting: init API...")

    api_prefix = "/backendapi"
    app.register_blueprint(
        create_document_processing_api(),
        url_prefix=api_prefix + "/document"
    )
    app.register_blueprint(
        create_figure_processing_api(),
        url_prefix=api_prefix + "/figure"
    )
    app.register_blueprint(
        create_app_db_api(app),
        url_prefix=api_prefix + "/db"
    )
    app.register_blueprint(
        create_readiness_check_api(),
        url_prefix="/"
    )
    logger.debug("Complete: init API...")

    # In production we use a HTTP server appropriate for production.
    if is_prod:
        logger.debug("Starting: gevent.WSGIServer...")
        # There are two proxies -- the one that"s run as a sibling of this process, and
        # the Ingress controller that runs on the cluster.
        # See: https://skiff.allenai.org/templates.html
        num_proxies = 2
        proxied_app = ProxyFix(app, x_for=num_proxies, x_proto=num_proxies, x_host=num_proxies,
                               x_port=num_proxies)
        http_server = WSGIServer(("0.0.0.0", args.port), proxied_app, log=logger,
            error_log=logger)
        app.logger.info(f"Server listening at http://0.0.0.0:{args.port}")
        http_server.serve_forever()
    else:
        logger.debug("Starting: Flask development server...")
        num_proxies = 1
        proxied_app = ProxyFix(app, x_for=num_proxies, x_proto=num_proxies, x_host=num_proxies,
                               x_port=num_proxies)
        app.run(host="0.0.0.0", port=args.port)

if __name__ == "__main__":
    start()

