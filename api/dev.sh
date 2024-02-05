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
    --reload \
    "start:create_app()"
