from flask import Blueprint
# diretório para consolidar as api's e documentar no swagger

bp = Blueprint('api', __name__)

from app.api import swagger