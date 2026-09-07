import secrets
from hmac import compare_digest

from flask import (
    abort,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from sqlalchemy.exc import SQLAlchemyError

from app.subscriptions import bp
from app.subscriptions.models import Subscription
from app.subscriptions.service import (
    RECURRENCE_OPTIONS,
    annualize_value,
    build_subscription_summary,
    get_recurrence,
    validate_subscription_form,
)
from extensions.db import db


_CSRF_SESSION_KEY = 'subscription_csrf_token'
_EMPTY_FORM_VALUES = {
    'name': '',
    'value': '',
    'recurrence': 'monthly',
}


def _get_csrf_token():
    token = session.get(_CSRF_SESSION_KEY)
    if not token:
        token = secrets.token_urlsafe(32)
        session[_CSRF_SESSION_KEY] = token
    return token


def _require_valid_csrf_token():
    expected_token = session.get(_CSRF_SESSION_KEY)
    provided_token = request.form.get('csrf_token')

    if (
        not isinstance(expected_token, str)
        or not isinstance(provided_token, str)
        or not compare_digest(expected_token, provided_token)
    ):
        abort(400, description='The form token is invalid or has expired.')


def _commit_database_changes():
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        raise


def _load_subscriptions():
    statement = db.select(Subscription).order_by(
        Subscription.created_at.desc(),
        Subscription.id.desc(),
    )
    return db.session.execute(statement).scalars().all()


def _render_page(form_values=None, errors=None):
    subscriptions = _load_subscriptions()
    rows = tuple(
        {
            'record': subscription,
            'annual_value': annualize_value(
                subscription.value,
                subscription.recurrence,
            ),
            'recurrence_label': get_recurrence(
                subscription.recurrence,
            )['label'],
        }
        for subscription in subscriptions
    )

    return render_template(
        'subscriptions/index.html',
        csrf_token=_get_csrf_token(),
        errors=errors or {},
        form_values=form_values or dict(_EMPTY_FORM_VALUES),
        recurrence_options=RECURRENCE_OPTIONS,
        rows=rows,
        summary=build_subscription_summary(subscriptions),
    )


@bp.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'GET':
        return _render_page()

    _require_valid_csrf_token()
    values, errors, form_values = validate_subscription_form(request.form)
    if errors:
        return _render_page(form_values, errors), 400

    subscription = Subscription(**values)
    db.session.add(subscription)
    _commit_database_changes()

    flash(f'{subscription.name} was added.', 'success')
    return redirect(url_for('subscriptions.index'), code=303)


@bp.post('/<int:subscription_id>/delete/')
def delete(subscription_id):
    _require_valid_csrf_token()
    subscription = db.session.get(Subscription, subscription_id)
    if subscription is None:
        abort(404)

    subscription_name = subscription.name
    db.session.delete(subscription)
    _commit_database_changes()

    flash(f'{subscription_name} was removed.', 'success')
    return redirect(url_for('subscriptions.index'), code=303)
