#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
python manage.py createcachetable

# Delete blacklist rows for refresh tokens that have expired anyway
python manage.py flushexpiredtokens
