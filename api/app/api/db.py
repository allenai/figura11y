import os
import datetime
import json
from contextlib import contextmanager
from flask import Blueprint, jsonify, request, make_response, Flask, g
from app.services.schema import SerializableBase, User, Paper, Figure, Description, Settings, Suggestions, Event, GeneratedDescription
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import sessionmaker


################################################################################################
# API Routes
#
# URLs for API endpoints defined here.
# N.B. we re-use endpoints across methods
# So, each one served as a single-point mapping to a resource across varying operational scopes.
################################################################################################

# User
USER = "/user"
USER_BY_ID = "/user/<int:user_id>"
USER_BY_GOOGLE_ID = "/user/google/<string:google_id>"

# Paper
PAPER = "/paper"
PAPER_BY_ID = "/paper/<int:paper_id>"
PAPERS_BY_USER_ID = "/paper/user/<int:user_id>"

# Figure
FIGURE = "/figure"
FIGURE_BY_ID = "/figure/<int:figure_id>"
FIGURES_BY_USER_ID = "/figure/user/<int:user_id>"
FIGURES_BY_PAPER_ID = "/figure/paper/<int:paper_id>"

# Description
DESCRIPTION = "/description"
DESCRIPTION_BY_ID = "/description/<int:description_id>"
DESCRIPIONS_BY_USER_ID = "/description/user/<int:user_id>"
DESCRIPTIONS_BY_FIGURE_ID = "/description/figure/<int:figure_id>"
DESCRIPTIONS_BY_PAPER_ID = "/description/paper/<int:paper_id>"

# Settings
SETTINGS = "/settings"
SETTINGS_BY_ID = "/settings/<int:settings_id>"
SETTINGS_BY_USER_ID = "/settings/user/<int:user_id>"

# Suggestions
SUGGESTIONS = "/suggestions"
SUGGESTIONS_BY_ID = "/suggestions/<int:suggestions_id>"
SUGGESTIONS_BY_USER_ID = "/suggestions/user/<int:user_id>"
SUGGESTIONS_BY_DESCRIPTION_ID = "/suggestions/description/<int:description_id>"

# Event
EVENT = "/event"
EVENT_BY_ID = "/event/<int:event_id>"
EVENTS_BY_USER_ID = "/event/user/<int:user_id>"
EVENTS_BY_FIGURE_ID = "/event/figure/<int:figure_id>"
EVENTS_BY_DESCRIPTION_ID = "/event/description/<int:description_id>"

# Generated Description
GENERATED_DESCRIPTION = "/generated_description"
GENERATED_DESCRIPTION_BY_ID = "/generated_description/<int:generated_description_id>"
GENERATED_DESCRIPTIONS_BY_FIGURE_ID = "/generated_description/figure/<int:figure_id>"


################################################################################################
# API Blueprint
#
# Define the API blueprint and all its routes.
################################################################################################

def create_app_db_api(app: Flask) -> Blueprint:
    """Get a Flask Blueprint for the database API.


    Returns:
        Blueprint: Blueprint for database API.
    """

    api = Blueprint("db", __name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["POSTGRES_URL"]
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db = SQLAlchemy(app)

    SerializableBase.metadata.create_all(db.engine)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db.engine)

    @contextmanager
    def get_db():
        if "db" not in g:
            g.db = SessionLocal()
        try:
            yield g.db
        finally:
            g.db.close()

    # =========================================
    # User-Related Routes
    # =========================================

    @api.route(USER, methods=["GET"])
    def get_users():
        with get_db() as db:
            users = db.query(User).all()
            return make_response(jsonify([user.to_dict() for user in users]), 200)

    @api.route(USER_BY_ID, methods=["GET"])
    def get_user(user_id: int):
        with get_db() as db:
            user = db.query(User).get(user_id)
            if not user:
                return make_response(jsonify({"error": "User not found"}), 404)
            return make_response(jsonify(user.to_dict()), 200)

    @api.route(USER_BY_ID, methods=["POST"])
    def add_or_update_user(user_id: int):
        with get_db() as db:
            user_data = request.json
            user = db.query(User).get(user_id)

            if not user and user_data.get("g_id", None):
                user = db.query(User).filter(User.g_id == user_data["g_id"]).first()

            if not user and user_data.get("username", None):
                user = db.query(User).filter(User.username == user_data["username"]).first()

            if not user:
                if ("g_id" not in user_data) and ("username" not in user_data):
                    return make_response(jsonify({"error": "Must provide either g_id or username"}), 400)
                user = User(
                    id=user_id,
                    g_id=user_data["g_id"],
                    username=user_data["username"],
                )
                db.add(user)
            else:
                user.id = user_data.get("id", user.id)
                user.g_id = user_data.get("g_id", user.g_id)
                user.username = user_data.get("username", user.username)
            db.commit()
            return make_response(jsonify(user.to_dict()), 200)

    @api.route(USER_BY_GOOGLE_ID, methods=["POST"])
    def add_or_update_user_by_google_id(google_id: str):
        with get_db() as db:
            user_data = request.json
            if "g_id" not in user_data:
                user_data["g_id"] = google_id
            user = db.query(User).filter(User.g_id == user_data["g_id"]).first()

            if not user and user_data.get("username", None):
                user = db.query(User).filter(User.username == user_data["username"]).first()

            if not user:
                user = User(
                    g_id=google_id,
                    username=user_data["username"]
                )
                db.add(user)
            else:
                user.username = user_data.get("username", user.username)
            db.commit()
            return make_response(jsonify(user.to_dict()), 200)

    @api.route(USER_BY_ID, methods=["DELETE"])
    def delete_user(user_id: int):
        with get_db() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return make_response(jsonify({"error": "User not found"}), 404)
            db.delete(user)
            db.commit()
            return make_response(jsonify({"message": "User deleted"}), 200)

    # =========================================
    # Paper-Related Routes
    # =========================================

    @api.route(PAPER, methods=["GET"])
    def get_papers():
        with get_db() as db:
            papers = db.query(Paper).all()
            return make_response(jsonify([paper.to_dict() for paper in papers]), 200)

    @api.route(PAPER_BY_ID, methods=["GET"])
    def get_paper(paper_id: int):
        with get_db() as db:
            paper = db.query(Paper).filter(Paper.id == paper_id).first()
            if not paper:
                return make_response(jsonify({"error": "Paper not found"}), 404)
            return make_response(jsonify(paper.to_dict()), 200)

    @api.route(PAPER, methods=["POST"])
    def add_or_update_paper():
        with get_db() as db:
            paper_data = request.json
            paper = None

            if "id" in paper_data:
                paper = db.query(Paper).filter(Paper.id == paper_data["id"]).first()

            paper_data["pdf_file"] = paper_data["pdf_file"].encode("utf-8")
            if not paper:
                paper = Paper(
                    pdf_file=paper_data["pdf_file"],
                    filename=paper_data["filename"],
                    user_id=paper_data["user_id"],
                    title=paper_data.get("title", None),
                    authors=paper_data.get("authors", None),
                )
                db.add(paper)
            else:
                paper.pdf_file = paper_data["pdf_file"]
                paper.filename = paper_data["filename"]
                paper.user_id = paper_data["user_id"]
                paper.title = paper_data.get("title", None)
                author_list = paper_data.get("authors", None)
                if isinstance(author_list, list):
                    paper.authors = ", ".join(author_list)
                else:
                    paper.authors = author_list
            db.commit()
            return make_response(jsonify(paper.to_dict()), 200)

    @api.route(PAPER_BY_ID, methods=["DELETE"])
    def delete_paper(paper_id: int):
        with get_db() as db:
            paper = db.query(Paper).filter(Paper.id == paper_id).first()
            if not paper:
                return make_response(jsonify({"error": "Paper not found"}), 404)
            db.delete(paper)
            db.commit()
            return make_response(jsonify({"message": "Paper deleted"}), 200)

    @api.route(PAPERS_BY_USER_ID, methods=["GET"])
    def get_papers_by_user_id(user_id: int):
        with get_db() as db:
            papers = db.query(Paper).filter(Paper.user_id == user_id).all()
            return make_response(jsonify([paper.to_dict() for paper in papers]), 200)

    # =========================================
    # Figure-Related Routes
    # =========================================

    @api.route(FIGURE, methods=["GET"])
    def get_figures():
        with get_db() as db:
            figures = db.query(Figure).all()
            return make_response(jsonify([figure.to_dict() for figure in figures]), 200)

    @api.route(FIGURE_BY_ID, methods=["GET"])
    def get_figure(figure_id: int):
        with get_db() as db:
            figure = db.query(Figure).filter(Figure.id == figure_id).first()
            if not figure:
                return make_response(jsonify({"error": "Figure not found"}), 404)
            return make_response(jsonify(figure.to_dict()), 200)

    @api.route(FIGURE, methods=["POST"])
    def add_or_update_figure():
        with get_db() as db:
            figure_data = request.json
            figure = None

            referer_url = request.headers.get("Referer", "")
            detect_is_study_session = "/study" in referer_url

            dimensions = figure_data["dimensions"]
            if isinstance(dimensions, dict):
                figure_data["dimensions"] = json.dumps(dimensions)

            if "id" in figure_data:
                figure = db.query(Figure).filter(Figure.id == figure_data["id"]).first()
            if not figure:
                figure = Figure(
                    base64_encoded=figure_data["base64_encoded"],
                    filename=figure_data["filename"],
                    dimensions=figure_data["dimensions"],
                    ocr_text=figure_data.get("ocr_text", None),
                    figure_type=figure_data["figure_type"],
                    caption=figure_data["caption"],
                    mentions_paragraphs=figure_data["mentions_paragraphs"],
                    data_table=figure_data.get("data_table", None),
                    paper_id=figure_data["paper_id"],
                    user_id=figure_data["user_id"],
                    study_session=figure_data.get("study_session", detect_is_study_session)
                )
                db.add(figure)
            else:
                figure.base64_encoded = figure_data["base64_encoded"]
                figure.filename = figure_data["filename"]
                figure.dimensions = figure_data["dimensions"]
                figure.ocr_text = figure_data.get("ocr_text", None)
                figure.figure_type = figure_data["figure_type"]
                figure.caption = figure_data["caption"]
                figure.mentions_paragraphs = figure_data["mentions_paragraphs"]
                figure.data_table = figure_data.get("data_table", None)
                figure.paper_id = figure_data["paper_id"]
                figure.user_id = figure_data["user_id"]
                figure.study_session = figure_data.get("study_session", detect_is_study_session)
            db.commit()
            return make_response(jsonify(figure.to_dict()), 200)

    @api.route(FIGURE_BY_ID, methods=["DELETE"])
    def delete_figure(figure_id: int):
        with get_db() as db:
            figure = db.query(Figure).filter(Figure.id == figure_id).first()
            if not figure:
                return make_response(jsonify({"error": "Figure not found"}), 404)
            db.delete(figure)
            db.commit()
            return make_response(jsonify({"message": "Figure deleted"}), 200)

    @api.route(FIGURES_BY_USER_ID, methods=["GET"])
    def get_figures_by_user_id(user_id: int):
        with get_db() as db:
            figures = db.query(Figure).filter(Figure.user_id == user_id).all()
            return make_response(jsonify([figure.to_dict() for figure in figures]), 200)

    @api.route(FIGURES_BY_PAPER_ID, methods=["GET"])
    def get_figures_by_paper_id(paper_id: int):
        with get_db() as db:
            figures = db.query(Figure).filter(Figure.paper_id == paper_id).all()
            return make_response(jsonify([figure.to_dict() for figure in figures]), 200)

    # =========================================
    # Description-Related Routes
    # =========================================

    @api.route(DESCRIPTION, methods=["GET"])
    def get_descriptions():
        with get_db() as db:
            descriptions = db.query(Description).all()
            return make_response(jsonify([description.to_dict() for description in descriptions]), 200)

    @api.route(DESCRIPTION_BY_ID, methods=["GET"])
    def get_description(description_id: int):
        with get_db() as db:
            description = db.query(Description).filter(Description.id == description_id).first()
            if not description:
                return make_response(jsonify({"error": "Description not found"}), 404)
            return make_response(jsonify(description.to_dict()), 200)

    @api.route(DESCRIPTION, methods=["POST"])
    def add_or_update_description():
        with get_db() as db:
            description_data = request.json
            description = None

            referer_url = request.headers.get("Referer", "")
            detect_is_study_session = "/study" in referer_url

            if "id" in description_data:
                description = db.query(Description).filter(Description.id == description_data["id"]).first()
            if not description and "figure_id" in description_data:
                description = db.query(Description).filter(Description.figure_id == description_data["figure_id"]).first()

            if not description:
                description = Description(
                    current_string=description_data.get("current_string", ""),
                    current_html=description_data.get("current_html", ""),
                    summarized_version=description_data.get("summarized_version", ""),
                    user_id=description_data["user_id"],
                    figure_id=description_data["figure_id"],
                    paper_id=description_data["paper_id"],
                    study_session=description_data.get("study_session", detect_is_study_session)
                )
                db.add(description)
            else:
                if "current_string" in description_data \
                    and "current_html" in description_data \
                    and len(description_data["current_string"]) > 0 \
                    and len(description_data["current_html"]) > 0:
                        description.current_string = description_data["current_string"]
                        description.current_html = description_data["current_html"]
                        history = description.history
                        if not isinstance(history, list):
                            history = []
                        history.append({"current_string": description.current_string, "current_html": description.current_html})
                        description.history = history

                if "summarized_version" in description_data:
                    description.summarized_version = description_data["summarized_version"]
                description.user_id = description_data["user_id"]
                description.figure_id = description_data["figure_id"]
                description.paper_id = description_data["paper_id"]
                description.condition = description_data.get("condition", "full")
                description.study_session = description_data.get("study_session", detect_is_study_session)
            db.commit()
            return make_response(jsonify(description.to_dict()), 200)

    @api.route(DESCRIPTION_BY_ID, methods=["DELETE"])
    def delete_description(description_id: int):
        with get_db() as db:
            description = db.query(Description).filter(Description.id == description_id).first()
            if not description:
                return make_response(jsonify({"error": "Description not found"}), 404)
            db.delete(description)
            db.commit()
            return make_response(jsonify({"message": "Description deleted"}), 200)

    @api.route(DESCRIPIONS_BY_USER_ID, methods=["GET"])
    def get_descriptions_by_user_id(user_id: int):
        with get_db() as db:
            descriptions = db.query(Description).filter(Description.user_id == user_id).all()
            return make_response(jsonify([description.to_dict() for description in descriptions]), 200)

    @api.route(DESCRIPTIONS_BY_FIGURE_ID, methods=["GET"])
    def get_descriptions_by_figure_id(figure_id: int):
        with get_db() as db:
            descriptions = db.query(Description).filter(Description.figure_id == figure_id).all()
            return make_response(jsonify([description.to_dict() for description in descriptions]), 200)

    @api.route(DESCRIPTIONS_BY_PAPER_ID, methods=["GET"])
    def get_descriptions_by_paper_id(paper_id: int):
        with get_db() as db:
            descriptions = db.query(Description).filter(Description.paper_id == paper_id).all()
            return make_response(jsonify([description.to_dict() for description in descriptions]), 200)

    # =========================================
    # Settings-Related Routes
    # =========================================

    @api.route(SETTINGS, methods=["GET"])
    def get_settings():
        with get_db() as db:
            settings = db.query(Settings).all()
            return make_response(jsonify([setting.to_dict() for setting in settings]), 200)

    @api.route(SETTINGS_BY_ID, methods=["GET"])
    def get_settings_by_id(settings_id: int):
        with get_db() as db:
            settings = db.query(Settings).filter(Settings.id == settings_id).first()
            if not settings:
                return make_response(jsonify({"error": "Settings not found"}), 404)
            return make_response(jsonify(settings.to_dict()), 200)

    @api.route(SETTINGS_BY_ID, methods=["POST"])
    def add_or_update_settings():
        referer_url = request.headers.get("Referer", "")
        detect_is_study_session = "/study" in referer_url

        with get_db() as db:
            settings_data = request.json
            settings = db.query(Settings).filter(Settings.id == settings_data["id"]).first()
            if not settings:
                settings = Settings(
                    current_settings=settings_data["settings"],
                    user_id=settings_data["user_id"],
                    study_session=settings_data.get("study_session", detect_is_study_session)
                )
                db.add(settings)
            else:
                history = settings_data.get("history", [])
                history.append({"timestamp": datetime.datetime.utcnow().isoformat(), "settings": settings.current_settings})
                settings.history = history
                settings.current_settings = settings_data["settings"]
                settings.user_id = settings_data["user_id"]
                settings.study_session = settings_data.get("study_session", detect_is_study_session)
            db.commit()
            return make_response(jsonify(settings.to_dict()), 200)

    @api.route(SETTINGS_BY_ID, methods=["DELETE"])
    def delete_settings(settings_id: int):
        with get_db() as db:
            settings = db.query(Settings).filter(Settings.id == settings_id).first()
            if not settings:
                return make_response(jsonify({"error": "Settings not found"}), 404)
            db.delete(settings)
            db.commit()
            return make_response(jsonify({"message": "Settings deleted"}), 200)

    @api.route(SETTINGS_BY_USER_ID, methods=["GET"])
    def get_settings_by_user_id(user_id: int):
        with get_db() as db:
            settings = db.query(Settings).filter(Settings.user_id == user_id).all()
            return make_response(jsonify([setting.to_dict() for setting in settings]), 200)

    # =========================================
    # Suggestions-Related Routes
    # =========================================

    @api.route(SUGGESTIONS, methods=["GET"])
    def get_suggestions():
        with get_db() as db:
            suggestions = db.query(Suggestions).all()
            return make_response(jsonify([suggestion.to_dict() for suggestion in suggestions]), 200)

    @api.route(SUGGESTIONS_BY_ID, methods=["GET"])
    def get_suggestions_by_id(suggestions_id: int):
        with get_db() as db:
            suggestions = db.query(Suggestions).filter(Suggestions.id == suggestions_id).first()
            if not suggestions:
                return make_response(jsonify({"error": "Suggestions not found"}), 404)
            return make_response(jsonify(suggestions.to_dict()), 200)

    @api.route(SUGGESTIONS, methods=["POST"])
    def add_or_update_suggestions():
        with get_db() as db:
            suggestions_data = request.json
            suggestions = None

            referer_url = request.headers.get("Referer", "")
            detect_is_study_session = "/study" in referer_url

            if "id" in suggestions_data:
                suggestions = db.query(Suggestions).filter(Suggestions.id == suggestions_data["id"]).first()

            content = suggestions_data["content"]
            if isinstance(content, dict):
                suggestions_data["content"] = json.dumps(content)
            if not suggestions:
                suggestions = Suggestions(
                    content=suggestions_data["content"],
                    suggestion_type=suggestions_data["suggestion_type"],
                    model=suggestions_data["model"],
                    text_context=suggestions_data["text_context"],
                    user_id=suggestions_data["user_id"],
                    description_id=suggestions_data["description_id"],
                    study_session=suggestions_data.get("study_session", detect_is_study_session)
                )
                db.add(suggestions)
            else:
                suggestions.content = suggestions_data["content"]
                suggestions.suggestion_type = suggestions_data["suggestion_type"]
                suggestions.model = suggestions_data["model"]
                suggestions.text_context = suggestions_data["text_context"]
                suggestions.user_id = suggestions_data["user_id"]
                suggestions.description_id = suggestions_data["description_id"]
                suggestions.study_session = suggestions_data.get("study_session", detect_is_study_session)
            db.commit()
            return make_response(jsonify(suggestions.to_dict()), 200)

    @api.route(SUGGESTIONS_BY_ID, methods=["DELETE"])
    def delete_suggestions(suggestions_id: int):
        with get_db() as db:
            suggestions = db.query(Suggestions).filter(Suggestions.id == suggestions_id).first()
            if not suggestions:
                return make_response(jsonify({"error": "Suggestions not found"}), 404)
            db.delete(suggestions)
            db.commit()
            return make_response(jsonify({"message": "Suggestions deleted"}), 200)

    @api.route(SUGGESTIONS_BY_USER_ID, methods=["GET"])
    def get_suggestions_by_user_id(user_id: int):
        with get_db() as db:
            suggestions = db.query(Suggestions).filter(Suggestions.user_id == user_id).all()
            return make_response(jsonify([suggestion.to_dict() for suggestion in suggestions]), 200)

    @api.route(SUGGESTIONS_BY_DESCRIPTION_ID, methods=["GET"])
    def get_suggestions_by_description_id(description_id: int):
        with get_db() as db:
            suggestions = db.query(Suggestions).filter(Suggestions.description_id == description_id).all()
            return make_response(jsonify([suggestion.to_dict() for suggestion in suggestions]), 200)

    # =========================================
    # Event-Related Routes
    # =========================================

    @api.route(EVENT, methods=["GET"])
    def get_events():
        with get_db() as db:
            events = db.query(Event).all()
            return make_response(jsonify([event.to_dict() for event in events]), 200)

    @api.route(EVENT_BY_ID, methods=["GET"])
    def get_event(event_id: int):
        with get_db() as db:
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event:
                return make_response(jsonify({"error": "Event not found"}), 404)
            return make_response(jsonify(event.to_dict()), 200)

    @api.route(EVENT, methods=["POST"])
    def add_or_update_event():
        with get_db() as db:
            event_data = request.json
            event = None

            referer_url = request.headers.get("Referer", "")
            detect_is_study_session = "/study" in referer_url

            # Right now, we don't update events
            event = Event(
                event_type=event_data["event_type"],
                event_data=event_data["event_data"],
                condition=event_data["condition"],
                user_id=event_data["user_id"],
                figure_id=event_data["figure_id"],
                description_id=event_data["description_id"],
                study_session=event_data.get("study_session", detect_is_study_session)
            )
            db.add(event)
            db.commit()
            return make_response(jsonify(event.to_dict()), 200)

    @api.route(EVENT_BY_ID, methods=["DELETE"])
    def delete_event(event_id: int):
        with get_db() as db:
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event:
                return make_response(jsonify({"error": "Event not found"}), 404)
            db.delete(event)
            db.commit()
            return make_response(jsonify({"message": "Event deleted"}), 200)

    @api.route(EVENTS_BY_USER_ID, methods=["GET"])
    def get_events_by_user_id(user_id: int):
        with get_db() as db:
            events = db.query(Event).filter(Event.user_id == user_id).all()
            return make_response(jsonify([event.to_dict() for event in events]), 200)

    @api.route(EVENTS_BY_FIGURE_ID, methods=["GET"])
    def get_events_by_figure_id(figure_id: int):
        with get_db() as db:
            events = db.query(Event).filter(Event.figure_id == figure_id).all()
            return make_response(jsonify([event.to_dict() for event in events]), 200)

    @api.route(EVENTS_BY_DESCRIPTION_ID, methods=["GET"])
    def get_events_by_description_id(description_id: int):
        with get_db() as db:
            events = db.query(Event).filter(Event.description_id == description_id).all()
            return make_response(jsonify([event.to_dict() for event in events]), 200)

    # =========================================
    # Generated Description-Related Routes (Study)
    # =========================================

    @api.route(GENERATED_DESCRIPTION, methods=["GET"])
    def get_generated_descriptions():
        with get_db() as db:
            generated_descriptions = db.query(GeneratedDescription).all()
            return make_response(jsonify([generated_description.to_dict() for generated_description in generated_descriptions]), 200)

    @api.route(GENERATED_DESCRIPTION_BY_ID, methods=["GET"])
    def get_generated_description(generated_description_id: int):
        with get_db() as db:
            generated_description = db.query(GeneratedDescription).filter(GeneratedDescription.id == generated_description_id).first()
            if not generated_description:
                return make_response(jsonify({"error": "Generated Description not found"}), 404)
            return make_response(jsonify(generated_description.to_dict()), 200)

    @api.route(GENERATED_DESCRIPTION, methods=["POST"])
    def add_or_update_generated_description():
        with get_db() as db:
            generated_description_data = request.json
            generated_description = None

            if "id" in generated_description_data:
                generated_description = db.query(GeneratedDescription).filter(GeneratedDescription.id == generated_description_data["id"]).first()
            else:
                generated_description = db.query(GeneratedDescription).filter(
                    GeneratedDescription.figure_id == generated_description_data["figure_id"] and
                    GeneratedDescription.model == generated_description_data["model"]
                ).first()

            if not generated_description:
                generated_description = GeneratedDescription(
                    description=generated_description_data["description"],
                    model=generated_description_data["model"],
                    figure_id=generated_description_data["figure_id"]
                )
                db.add(generated_description)
            else:
                generated_description.description = generated_description_data["description"]
                generated_description.model = generated_description_data["model"]
                generated_description.figure_id = generated_description_data["figure_id"]
            db.commit()
            return make_response(jsonify(generated_description.to_dict()), 200)

    @api.route(GENERATED_DESCRIPTION_BY_ID, methods=["DELETE"])
    def delete_generated_description(generated_description_id: int):
        with get_db() as db:
            generated_description = db.query(GeneratedDescription).filter(GeneratedDescription.id == generated_description_id).first()
            if not generated_description:
                return make_response(jsonify({"error": "Generated Description not found"}), 404)
            db.delete(generated_description)
            db.commit()
            return make_response(jsonify({"message": "Generated Description deleted"}), 200)

    @api.route(GENERATED_DESCRIPTIONS_BY_FIGURE_ID, methods=["GET"])
    def get_generated_descriptions_by_figure_id(figure_id: int):
        with get_db() as db:
            generated_descriptions = db.query(GeneratedDescription).filter(GeneratedDescription.figure_id == figure_id).all()
            return make_response(jsonify([generated_description.to_dict() for generated_description in generated_descriptions]), 200)

    # =========================================
    # Misc. Routes
    # =========================================

    @api.route("/", methods=["GET"])
    def get_api():
        return make_response(jsonify({
            "Routes": {
                "User": {
                    "GET": USER,
                    "GET by ID": USER_BY_ID,
                    "POST": USER_BY_ID,
                    "DELETE": USER_BY_ID
                },
                "Paper": {
                    "GET": PAPER,
                    "GET by ID": PAPER_BY_ID,
                    "POST": PAPER_BY_ID,
                    "DELETE": PAPER_BY_ID,
                    "GET by User ID": PAPERS_BY_USER_ID
                },
                "Figure": {
                    "GET": FIGURE,
                    "GET by ID": FIGURE_BY_ID,
                    "POST": FIGURE_BY_ID,
                    "DELETE": FIGURE_BY_ID,
                    "GET by User ID": FIGURES_BY_USER_ID,
                    "GET by Paper ID": FIGURES_BY_PAPER_ID
                },
                "Description": {
                    "GET": DESCRIPTION,
                    "GET by ID": DESCRIPTION_BY_ID,
                    "POST": DESCRIPTION_BY_ID,
                    "DELETE": DESCRIPTION_BY_ID,
                    "GET by User ID": DESCRIPIONS_BY_USER_ID,
                    "GET by Figure ID": DESCRIPTIONS_BY_FIGURE_ID,
                    "GET by Paper ID": DESCRIPTIONS_BY_PAPER_ID
                },
                "Settings": {
                    "GET": SETTINGS,
                    "GET by ID": SETTINGS_BY_ID,
                    "POST": SETTINGS_BY_ID,
                    "DELETE": SETTINGS_BY_ID,
                    "GET by User ID": SETTINGS_BY_USER_ID
                },
                "Suggestions": {
                    "GET": SUGGESTIONS,
                    "GET by ID": SUGGESTIONS_BY_ID,
                    "POST": SUGGESTIONS_BY_ID,
                    "DELETE": SUGGESTIONS_BY_ID,
                    "GET by User ID": SUGGESTIONS_BY_USER_ID,
                    "GET by Description ID": SUGGESTIONS_BY_DESCRIPTION_ID
                },
                "Event": {
                    "GET": EVENT,
                    "GET by ID": EVENT_BY_ID,
                    "POST": EVENT_BY_ID,
                    "DELETE": EVENT_BY_ID,
                    "GET by User ID": EVENTS_BY_USER_ID,
                    "GET by Figure ID": EVENTS_BY_FIGURE_ID,
                    "GET by Description ID": EVENTS_BY_DESCRIPTION_ID
                },
                "Generated Description": {
                    "GET": GENERATED_DESCRIPTION,
                    "GET by ID": GENERATED_DESCRIPTION_BY_ID,
                    "POST": GENERATED_DESCRIPTION_BY_ID,
                    "DELETE": GENERATED_DESCRIPTION_BY_ID,
                    "GET by Figure ID": GENERATED_DESCRIPTIONS_BY_FIGURE_ID
                }
            }
        }), 200)

    return api
