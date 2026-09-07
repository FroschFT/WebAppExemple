from app.api.catalog import build_service_catalog, get_base_url
from tests.base import AppTestCase


class SwaggerCatalogTests(AppTestCase):
    def test_known_service_uses_curated_metadata(self):
        services = build_service_catalog(
            {
                'FROSCH_KANJI_BACK': 'http://127.0.0.1:8084/swagger',
            },
            'testing',
        )

        self.assertEqual(len(services), 1)
        service = services[0]
        self.assertEqual(service['id'], 'frosch-kanji-api')
        self.assertEqual(service['name'], 'Frosch Kanji API')
        self.assertEqual(service['environment'], 'Testing')
        self.assertEqual(service['operation_count'], 6)
        self.assertEqual(service['base_url'], 'http://127.0.0.1:8084')

    def test_generic_service_gets_stable_fallback_metadata(self):
        service = build_service_catalog(
            {
                'PAYMENTS_API': 'https://api.example.com/v2/swagger/',
            },
            'production',
        )[0]

        self.assertEqual(service['id'], 'payments-api')
        self.assertEqual(service['name'], 'Payments Api')
        self.assertEqual(service['environment'], 'Production')
        self.assertEqual(service['base_url'], 'https://api.example.com/v2')
        self.assertEqual(service['operation_count'], 0)

    def test_invalid_and_blank_entries_are_ignored(self):
        services = build_service_catalog({
            '': 'https://example.com/swagger',
            'BLANK': '   ',
            'FTP_API': 'ftp://example.com/swagger',
            'VALID_API': 'https://example.com/swagger',
        })

        self.assertEqual(len(services), 1)
        self.assertEqual(services[0]['id'], 'valid-api')

    def test_base_url_preserves_non_swagger_paths(self):
        self.assertEqual(
            get_base_url('https://example.com/openapi/docs/'),
            'https://example.com/openapi/docs',
        )

    def test_empty_catalog_renders_empty_state(self):
        self.app.config['SWAGGER_URLS'] = {}

        response = self.client.get('/swagger/')

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'No Swagger services configured', response.data)
        self.assertNotIn(b'data-api-service', response.data)
