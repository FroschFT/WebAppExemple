from flask import abort, current_app, redirect, render_template, url_for

from app.api import bp
from app.api.catalog import build_service_catalog


def get_services():
    return build_service_catalog(
        current_app.config.get('SWAGGER_URLS', {}),
        current_app.config['ENVIRONMENT'],
    )


def get_service(service_id):
    return next(
        (service for service in get_services() if service['id'] == service_id),
        None,
    )


@bp.route('/')
def swagger():
    services = get_services()
    environments = sorted({
        service['environment']
        for service in services
    })
    statuses = sorted({
        service['status_label']
        for service in services
    })

    return render_template(
        'swagger/swagger.html',
        services=services,
        environments=environments,
        statuses=statuses,
        operation_count=sum(
            service['operation_count']
            for service in services
        ),
    )


@bp.route('/services/<service_id>/')
def service_detail(service_id):
    service = get_service(service_id)

    if service is None:
        abort(404, description='The requested API service was not found.')

    return render_template('swagger/server_page.html', service=service)


@bp.route('/subpageteste/')
def subpageteste():
    services = get_services()

    if not services:
        return redirect(url_for('api.swagger'))

    return redirect(url_for('api.service_detail', service_id=services[0]['id']))