import unittest

from app import create_app
from helpers import (
    get_debug,
    get_environment,
    get_swagger_urls,
    normalize_environment,
)
from tests.base import TestingConfig


class ConfigurationHelperTests(unittest.TestCase):
    def test_environment_aliases_are_normalized(self):
        cases = {
            None: 'development',
            'dev': 'development',
            'PRD': 'production',
            'prod': 'production',
            'test': 'testing',
        }

        for value, expected in cases.items():
            with self.subTest(value=value):
                self.assertEqual(normalize_environment(value), expected)

    def test_environment_uses_canonical_name_only(self):
        self.assertEqual(
            get_environment({'ENVIRONMENT': 'prd'}),
            'production',
        )
        self.assertEqual(
            get_environment({'ENVORIMENT': 'prd'}),
            'development',
        )

    def test_debug_values_are_parsed_strictly(self):
        for value in ('1', 'true', 'yes', 'on'):
            with self.subTest(value=value):
                self.assertTrue(get_debug({'DEBUG': value}))

        for value in ('0', 'false', 'no', 'off'):
            with self.subTest(value=value):
                self.assertFalse(get_debug({'DEBUG': value}))

        with self.assertRaises(RuntimeError):
            get_debug({'DEBUG': 'sometimes'})

    def test_swagger_urls_are_parsed_and_trimmed(self):
        urls = get_swagger_urls(
            'testing',
            {
                'SWAGGER_URLS': (
                    '{" Example API ": " https://example.com/swagger "}'
                ),
            },
        )

        self.assertEqual(
            urls,
            {'Example API': 'https://example.com/swagger'},
        )

    def test_invalid_swagger_configuration_is_rejected(self):
        invalid_values = (
            '{invalid',
            '[]',
            '{"": "https://example.com/swagger"}',
            '{"API": ""}',
        )

        for value in invalid_values:
            with self.subTest(value=value):
                with self.assertRaises(RuntimeError):
                    get_swagger_urls(
                        'testing',
                        {'SWAGGER_URLS': value},
                    )

    def test_production_requires_a_secret_key(self):
        class ProductionConfig(TestingConfig):
            ENVIRONMENT = 'production'
            SECRET_KEY = None

        with self.assertRaises(RuntimeError):
            create_app(ProductionConfig)

    def test_app_normalizes_environment_alias(self):
        class AliasConfig(TestingConfig):
            ENVIRONMENT = 'test'

        app = create_app(AliasConfig)

        self.assertEqual(app.config['ENVIRONMENT'], 'testing')
