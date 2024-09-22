from flask import render_template
from app.utilities import bp

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/utilities-color/')
def color():
    return render_template('helpers/utilities-color.html')

@bp.route('/utilities-border/')
def border():
    return render_template('helpers/utilities-border.html')

@bp.route('/utilities-animation/')
def animation():
    return render_template('helpers/utilities-animation.html')

@bp.route('/utilities-other/')
def other():
    return render_template('helpers/utilities-other.html')