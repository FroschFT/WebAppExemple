import os

basedir = os.path.abspath(os.path.dirname(__file__))



if os.environ.get('ENVORIMENT') == "PRD":
    swagger_urls = {#"FROSCH_KANJI_BACK": "http://127.0.0.1:8084/swagger",
                    #  "FROSCH_KANJI_BACK": "http://svc-back-pod:8080/swagger", ## gostaria de ser por essa forma internamente no cluster
                    #  "FROSCH_KANJI_BACK": "192.168.65.4:30001/swagger",
                     "FROSCH_KANJI_BACK": "http://localhost:30001/swagger",
                        "": ""
                        }
else:
    swagger_urls = {"FROSCH_KANJI_BACK": "http://127.0.0.1:8084/swagger",
                        "": ""
                        }

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    DEBUG = True

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI')\
        or 'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False