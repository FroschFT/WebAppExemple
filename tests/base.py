import unittest

from app import create_app


class TestingConfig:
    APP_NAME = 'WebApp Example Tests'
    TESTING = True
    ENVIRONMENT = 'testing'
    DEBUG = False
    SECRET_KEY = 'test-secret-key'
    SWAGGER_URLS = {
        'FROSCH_KANJI_BACK': 'http://127.0.0.1:8084/swagger',
    }
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class AppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestingConfig)
        self.client = self.app.test_client()

    def assert_page_contains(self, path, marker, status_code=200):
        response = self.client.get(path)

        self.assertEqual(response.status_code, status_code)
        self.assertIn(marker.encode('utf-8'), response.data)
        return response
