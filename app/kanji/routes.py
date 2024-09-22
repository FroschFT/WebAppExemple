from flask import render_template
from app.kanji import bp

@bp.route('/')
def kanji():
    return render_template('Kanji/Kanji.html')

@bp.route('/charts')
def charts():
    return render_template('helpers/charts.html')

@bp.route('/tables')
def tables():
    return render_template('helpers/tables.html')