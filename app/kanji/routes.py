from flask import render_template

from app.kanji import bp
from app.kanji.data import KANJI_CARDS


@bp.route('/')
def kanji():
    return render_template('kanji/kanji.html', kanji_cards=KANJI_CARDS)

@bp.route('/charts')
def charts():
    return render_template('helpers/charts.html')

@bp.route('/tables')
def tables():
    return render_template('helpers/tables.html')