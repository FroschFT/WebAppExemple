"""
Config
======

Configuration settings for the Flask web application.
"""

# Standard libraries
import os

# Third-party libraries
from dotenv import load_dotenv

# Local imports (Custom)
from helpers import get_debug, get_environment, get_swagger_urls


basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'), override=False)

DEVELOPMENT_SECRET_KEY = 'dev-only-secret-key'


class Config:
    """Base configuration for the Flask web application."""
    APP_NAME = 'WebApp Example'
    ENVIRONMENT = get_environment()
    DEBUG = get_debug()
    SECRET_KEY = os.environ.get('SECRET_KEY') or (
        None if ENVIRONMENT == 'production' else DEVELOPMENT_SECRET_KEY
    )
    SWAGGER_URLS = get_swagger_urls(ENVIRONMENT)

    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URI') or 'sqlite:///app.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False