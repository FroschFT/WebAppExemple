from flask import render_template
from app.api import bp
from config import swagger_urls

@bp.route('/')
def swagger():
    return render_template('swagger/swagger.html', swagger_url="BUUU")


@bp.route('/subpageteste/')
def subpageteste():
    swagger_url = swagger_urls["FROSCH_KANJI_BACK"]
    return render_template('swagger/server_page.html', swagger_url=swagger_url)