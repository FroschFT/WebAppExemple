from flask import render_template

from app.form import bp


@bp.route('/')
def index():
    return render_template('form/index.html')
