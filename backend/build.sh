#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate --noinput

# Create demo users
python manage.py create_demo_user

# Seed database with sample data
python manage.py seed_data