#!/bin/bash
export FLASK_APP="api.db:create_app_db_api()"

flask db init
flask db migrate -m "Auto migration"
flask db upgrade

exec \
    gunicorn \
    --workers 1 \
    --timeout 0 \
    --bind 0.0.0.0:8000 \
    --enable-stdio-inheritance \
    --access-logfile - \
    --access-logformat '{"timestamp": "%(t)s", "request_ip":"%(h)s", "x_forwarded_for":"%({X-Forwarded-For}i)s", "request_id":"%({X-Request-Id}i)s","response_code":"%(s)s","request_method":"%(m)s","request_path":"%(U)s","request_query":"%(q)s","response_time":"%(D)s","response_length":"%(B)s", "user_agent": "%(a)s"}' \
    "start:create_app()"
