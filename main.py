"""
Entry point for the WebApp Example Flask application.
"""

from app import create_app

if __name__ == '__main__':
    app = create_app()
    environment = app.config['ENVIRONMENT']
    host = '0.0.0.0' if environment == 'production' else '127.0.0.1'
    app.run(host=host, port=8081, debug=app.config['DEBUG'])