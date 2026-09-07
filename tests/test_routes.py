import re

from tests.base import AppTestCase


class PublicPageTests(AppTestCase):
    def test_primary_feature_pages_render(self):
        pages = {
            '/': 'Dashboard',
            '/chat/': 'id="chatApp"',
            '/agent/': 'id="agentApp"',
            '/agent/companion/': 'id="companionApp"',
            '/agent/mcps/': 'id="mcpExampleGrid"',
            '/swagger/': 'id="apiServiceGrid"',
            '/kanji/': 'id="kanjiGame"',
            '/form/': 'id="exampleRequestForm"',
            '/subscriptions/': 'id="subscriptionApp"',
            '/others/charts': 'id="myRadarChart"',
            '/others/tables': 'id="dataTable"',
        }

        for path, marker in pages.items():
            with self.subTest(path=path):
                self.assert_page_contains(path, marker)

    def test_feature_assets_are_served(self):
        assets = (
            '/static/css/theme.css',
            '/static/css/chat.css',
            '/static/css/agent.css',
            '/static/css/companion.css',
            '/static/css/mcp-overview.css',
            '/static/css/swagger-hub.css',
            '/static/css/kanji-game.css',
            '/static/css/form-example.css',
            '/static/css/subscriptions.css',
            '/static/js/theme.js',
            '/static/js/navigation.js',
            '/static/js/chat.js',
            '/static/js/agent-chat.js',
            '/static/js/companion.js',
            '/static/js/mcp-overview.js',
            '/static/js/swagger-hub.js',
            '/static/js/kanji-game.js',
            '/static/js/form-example.js',
            '/static/img/companion-nova.svg',
        )

        for path in assets:
            with self.subTest(path=path):
                response = self.client.get(path)
                try:
                    self.assertEqual(response.status_code, 200)
                    self.assertTrue(response.data)
                finally:
                    response.close()

    def test_chat_deep_link_selects_requested_conversation(self):
        response = self.assert_page_contains(
            '/chat/?conversation=design-team',
            'data-active-conversation="design-team"',
        )

        self.assertIn(b'data-open-conversation="true"', response.data)

    def test_chat_rejects_unknown_conversation(self):
        response = self.client.get('/chat/?conversation=unknown')

        self.assertEqual(response.status_code, 404)

    def test_swagger_service_detail_and_legacy_redirect(self):
        self.assert_page_contains(
            '/swagger/services/frosch-kanji-api/',
            'id="servicePageTitle"',
        )

        response = self.client.get('/swagger/subpageteste/')
        self.assertEqual(response.status_code, 302)
        self.assertTrue(
            response.headers['Location'].endswith(
                '/swagger/services/frosch-kanji-api/'
            )
        )

    def test_swagger_rejects_unknown_service(self):
        response = self.client.get('/swagger/services/unknown/')

        self.assertEqual(response.status_code, 404)

    def test_form_example_is_get_only(self):
        response = self.client.post('/form/')

        self.assertEqual(response.status_code, 405)

    def test_navigation_controller_is_loaded_globally(self):
        for path in ('/', '/agent/companion/', '/swagger/'):
            with self.subTest(path=path):
                response = self.client.get(path)

                self.assertEqual(response.status_code, 200)
                self.assertIn(
                    b'/static/js/navigation.js',
                    response.data,
                )

    def test_nested_sidebar_menus_mark_current_section(self):
        cases = (
            (
                '/agent/',
                'agentChatToggle',
                'collapseAgentChat',
                '/agent/',
            ),
            (
                '/agent/companion/',
                'agentChatToggle',
                'collapseAgentChat',
                '/agent/companion/',
            ),
            (
                '/agent/mcps/',
                'mcpServersToggle',
                'collapseMcpServers',
                '/agent/mcps/',
            ),
            (
                '/swagger/',
                'apiCatalogToggle',
                'collapseApiCatalog',
                '/swagger/',
            ),
            (
                '/swagger/services/frosch-kanji-api/',
                'apiCatalogToggle',
                'collapseApiCatalog',
                '/swagger/services/frosch-kanji-api/',
            ),
        )

        for path, heading_id, collapse_id, current_path in cases:
            with self.subTest(path=path):
                response = self.client.get(path)
                html = response.get_data(as_text=True)

                self.assertEqual(response.status_code, 200)
                self.assertRegex(
                    html,
                    (
                        r'<button class="nav-link sidebar-collapse-toggle"\s+'
                        rf'id="{heading_id}"[\s\S]*?aria-expanded="true"'
                    ),
                )
                self.assertIn(
                    f'id="{collapse_id}" class="collapse show"'.encode('utf-8'),
                    response.data,
                )
                self.assertRegex(
                    html,
                    (
                        r'<a class="collapse-item active"'
                        r'[\s\S]*?href="'
                        + re.escape(current_path)
                        + r'"[\s\S]*?aria-current="page"'
                    ),
                )
