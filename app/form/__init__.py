from flask import Blueprint

bp = Blueprint('form', __name__)

from app.form import routes
