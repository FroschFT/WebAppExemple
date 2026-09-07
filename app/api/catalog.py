import re
from urllib.parse import urlsplit, urlunsplit


KNOWN_SERVICES = {
    'FROSCH_KANJI_BACK': {
        'id': 'frosch-kanji-api',
        'name': 'Frosch Kanji API',
        'description': (
            'Kanji learning services for study sets, character lookup, '
            'practice sessions, and progress tracking.'
        ),
        'owner': 'Learning Platform',
        'version': 'v1',
        'specification': 'OpenAPI / Swagger',
        'auth': 'Bearer token',
        'tags': ('Kanji', 'Study', 'REST'),
        'operations': (
            {
                'method': 'GET',
                'path': '/kanji',
                'summary': 'List available Kanji characters',
                'auth_required': False,
            },
            {
                'method': 'GET',
                'path': '/kanji/{character}',
                'summary': 'Get readings and meanings for one character',
                'auth_required': False,
            },
            {
                'method': 'GET',
                'path': '/sets',
                'summary': 'List the available study sets',
                'auth_required': False,
            },
            {
                'method': 'POST',
                'path': '/practice/sessions',
                'summary': 'Start a practice session',
                'auth_required': True,
            },
            {
                'method': 'POST',
                'path': '/practice/sessions/{id}/answers',
                'summary': 'Record an answer in a practice session',
                'auth_required': True,
            },
            {
                'method': 'GET',
                'path': '/health',
                'summary': 'Read service health information',
                'auth_required': False,
            },
        ),
    },
}


def get_environment_label(environment):
    return environment.replace('-', ' ').replace('_', ' ').title()


def make_service_id(config_key):
    normalized_key = re.sub(r'[^a-z0-9]+', '-', config_key.lower()).strip('-')
    return normalized_key or 'configured-api'


def make_service_name(config_key):
    return ' '.join(part.capitalize() for part in config_key.split('_'))


def get_base_url(swagger_url):
    parsed_url = urlsplit(swagger_url)
    path = parsed_url.path.rstrip('/')

    if path.lower().endswith('/swagger'):
        path = path[:-len('/swagger')]

    return urlunsplit((
        parsed_url.scheme,
        parsed_url.netloc,
        path or '/',
        '',
        '',
    )).rstrip('/')


def build_service(config_key, swagger_url, environment='development'):
    known_service = KNOWN_SERVICES.get(config_key, {})
    operations = known_service.get('operations', ())
    parsed_url = urlsplit(swagger_url)
    environment_label = get_environment_label(environment)

    return {
        'id': known_service.get('id', make_service_id(config_key)),
        'config_key': config_key,
        'name': known_service.get('name', make_service_name(config_key)),
        'description': known_service.get(
            'description',
            'A configured API service available through the shared catalog.',
        ),
        'owner': known_service.get('owner', 'Platform Team'),
        'version': known_service.get('version', 'Unspecified'),
        'specification': known_service.get(
            'specification',
            'OpenAPI / Swagger',
        ),
        'auth': known_service.get('auth', 'Not specified'),
        'tags': known_service.get('tags', ('REST',)),
        'operations': operations,
        'operation_count': len(operations),
        'environment': environment_label,
        'environment_key': environment_label.lower(),
        'status': 'configured',
        'status_label': 'Configured',
        'swagger_url': swagger_url,
        'base_url': get_base_url(swagger_url),
        'host': parsed_url.netloc,
    }


def build_service_catalog(configured_urls, environment='development'):
    services = []

    for config_key, swagger_url in configured_urls.items():
        if not config_key or not isinstance(swagger_url, str) or not swagger_url.strip():
            continue

        parsed_url = urlsplit(swagger_url.strip())
        if parsed_url.scheme not in ('http', 'https') or not parsed_url.netloc:
            continue

        services.append(build_service(
            config_key,
            swagger_url.strip(),
            environment,
        ))

    return tuple(services)
