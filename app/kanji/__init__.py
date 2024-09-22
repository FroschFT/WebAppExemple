from flask import Blueprint

bp = Blueprint('kanji', __name__)

from app.kanji import routes