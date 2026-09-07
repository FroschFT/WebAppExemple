"""
Application Factory for the Flask web application.
"""

# Standard libraries
from datetime import datetime, timezone

# Third-party libraries
from flask import Flask, Blueprint

# Local imports (Custom)
from config import Config
from extensions.db import db
from helpers import normalize_environment


def validate_config(app:Flask):
    environment = normalize_environment(app.config.get('ENVIRONMENT'))
    app.config['ENVIRONMENT'] = environment
    secret_key = app.config.get('SECRET_KEY')

    if environment == 'production' and (
        not isinstance(secret_key, (str, bytes)) or not secret_key.strip()
    ):
        raise RuntimeError(
            'SECRET_KEY must be set when ENVIRONMENT is production.'
        )


def create_app(config_class=Config):
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static"
    )
    app.config.from_object(config_class)
    validate_config(app)

    db.init_app(app)

    # Register blueprints here
    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    from app.chat import bp as chat_bp
    app.register_blueprint(chat_bp, url_prefix='/chat')

    from app.agent import bp as agent_bp
    app.register_blueprint(agent_bp, url_prefix='/agent')

    from app.user import bp as user_bp
    app.register_blueprint(user_bp, url_prefix='/user')

    from app.others import bp as others_bp
    app.register_blueprint(others_bp, url_prefix='/others')

    from app.componentes import bp as componentes_bp
    app.register_blueprint(componentes_bp, url_prefix='/componentes')

    from app.form import bp as form_bp
    app.register_blueprint(form_bp, url_prefix='/form')

    from app.subscriptions import bp as subscriptions_bp
    app.register_blueprint(subscriptions_bp, url_prefix='/subscriptions')

    from app.utilities import bp as utilities_bp
    app.register_blueprint(utilities_bp, url_prefix='/utilities')

    from app.kanji import bp as kanji_bp
    app.register_blueprint(kanji_bp, url_prefix='/kanji')

    from app.erros import bp as erros_bp
    app.register_blueprint(erros_bp, url_prefix='/erros')

    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/swagger')

    from app.chat.routes import CONVERSATIONS
    from app.api.catalog import build_service_catalog
    from app.agent.service import get_registered_mcp_servers

    @app.context_processor
    def inject_shared_template_data():
        return {
            'app_name': app.config['APP_NAME'],
            'current_year': datetime.now(timezone.utc).year,
            'message_center_conversations': CONVERSATIONS[:4],
            'message_center_unread_count': sum(
                conversation['unread'] for conversation in CONVERSATIONS
            ),
            'swagger_navigation_services': build_service_catalog(
                app.config.get('SWAGGER_URLS', {}),
                app.config['ENVIRONMENT'],
            ),
            'agent_mcp_navigation_servers': get_registered_mcp_servers(),
        }

    @app.route('/test/')
    def test_page():
        return '<h1>Testing the Flask Application Factory Pattern</h1>'

    with app.app_context():
        db.create_all()

    return app