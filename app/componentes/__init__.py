from flask import Blueprint

bp = Blueprint('componentes', __name__)

from app.componentes import routes