from flask import render_template
from app.others import bp

@bp.route('/')
def blank():
    return render_template('blank.html')

@bp.route('/charts')
def charts():
    return render_template('helpers/charts.html')

@bp.route('/tables')
def tables():
    return render_template('helpers/tables.html')