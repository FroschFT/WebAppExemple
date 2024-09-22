import os
from app import create_app

if __name__ == '__main__':
    app = create_app()
    env = os.environ.get('ENVORIMENT')
    if env == "PRD":
        app.run(host='0.0.0.0', port=8081)
    else:
        app.run(port=8081)