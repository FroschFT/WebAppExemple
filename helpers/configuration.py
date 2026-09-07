import json
import os


_DEVELOPMENT_SWAGGER_URLS = {
    'FROSCH_KANJI_BACK': 'http://127.0.0.1:8084/swagger',
}
_PRODUCTION_SWAGGER_URLS = {
    'FROSCH_KANJI_BACK': 'http://localhost:30001/swagger',
}
_ENVIRONMENT_ALIASES = {
    'dev': 'development',
    'development': 'development',
    'prd': 'production',
    'prod': 'production',
    'production': 'production',
    'test': 'testing',
    'testing': 'testing',
}
_TRUE_VALUES = {'1', 'true', 'yes', 'on'}
_FALSE_VALUES = {'0', 'false', 'no', 'off'}


def normalize_environment(value):
    normalized_value = (value or 'development').strip().lower()
    return _ENVIRONMENT_ALIASES.get(normalized_value, normalized_value)


def get_environment(environ=None):
    environ = os.environ if environ is None else environ
    environment = environ.get('ENVIRONMENT')

    return normalize_environment(environment)


def get_debug(environ=None):
    environ = os.environ if environ is None else environ
    value = environ.get('DEBUG')

    if value is None:
        return False

    normalized_value = value.strip().lower()
    if normalized_value in _TRUE_VALUES:
        return True
    if normalized_value in _FALSE_VALUES:
        return False

    raise RuntimeError(
        'DEBUG must be one of: 1, true, yes, on, 0, false, no, or off.'
    )


def get_swagger_urls(environment, environ=None):
    environ = os.environ if environ is None else environ
    configured_urls = environ.get('SWAGGER_URLS')

    if configured_urls is None:
        defaults = (
            _PRODUCTION_SWAGGER_URLS
            if environment == 'production'
            else _DEVELOPMENT_SWAGGER_URLS
        )
        return dict(defaults)

    try:
        parsed_urls = json.loads(configured_urls)
    except json.JSONDecodeError as error:
        raise RuntimeError('SWAGGER_URLS must be a valid JSON object.') from error

    if not isinstance(parsed_urls, dict):
        raise RuntimeError('SWAGGER_URLS must be a JSON object of names and URLs.')

    swagger_urls = {}
    for name, url in parsed_urls.items():
        if not isinstance(name, str) or not name.strip():
            raise RuntimeError('Each SWAGGER_URLS service name must be non-empty.')
        if not isinstance(url, str) or not url.strip():
            raise RuntimeError('Each SWAGGER_URLS URL must be non-empty.')
        swagger_urls[name.strip()] = url.strip()

    return swagger_urls
