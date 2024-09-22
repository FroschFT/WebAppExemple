from flask import render_template
from app.erros import bp

@bp.route('/404')
def not_found():
    return render_template('erros/404.html')