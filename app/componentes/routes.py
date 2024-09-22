from flask import render_template
from app.componentes import bp

@bp.route('/')
def index():
    return render_template('blank.html')

@bp.route('/buttons/')
def buttons():
    return render_template('helpers/buttons.html')

@bp.route('/cards/')
def cards():
    return render_template('helpers/cards.html')