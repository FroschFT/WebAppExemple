from flask import Flask, Blueprint
from flask_restx import Api

from config import Config
from extensions.db import db


def create_app(config_class=Config):
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config.from_object(config_class)

    # Initialize Flask extensions here
    db.init_app(app)

    # Register blueprints here
    from app.main import bp as main_bp
    app.register_blueprint(main_bp)
  
    from app.user import bp as user_bp
    app.register_blueprint(user_bp, url_prefix='/user')

    from app.others import bp as others_bp
    app.register_blueprint(others_bp, url_prefix='/others')

    from app.componentes import bp as componentes_bp
    app.register_blueprint(componentes_bp, url_prefix='/componentes')

    from app.utilities import bp as utilities_bp
    app.register_blueprint(utilities_bp, url_prefix='/utilities')

    from app.kanji import bp as kanji_bp
    app.register_blueprint(kanji_bp, url_prefix='/kanji')

    from app.erros import bp as erros_bp
    app.register_blueprint(erros_bp, url_prefix='/erros')

    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/swagger')

    @app.route('/test/')
    def test_page():
        return '<h1>Testing the Flask Application Factory Pattern</h1>'

    return app