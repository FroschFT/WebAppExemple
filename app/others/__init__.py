from flask import Blueprint

bp = Blueprint('others', __name__)

from app.others import routes