from flask import Blueprint

bp = Blueprint('erros', __name__)

from app.erros import routes