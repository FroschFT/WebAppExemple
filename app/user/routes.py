from flask import render_template
from app.user import bp

@bp.route('/')
def login():
    return render_template('user/login.html')

@bp.route('/register')
def register():
    return render_template('user/register.html')

@bp.route('/forgot-password')
def forgot_password():
    return render_template('user/forgot-password.html')