from app import create_app
from app.agent import register_agent_provider, register_mcp_server
from app.agent.service import (
    MAX_AGENT_RESPONSE_LENGTH,
    get_registered_mcp_servers,
)
from tests.base import AppTestCase, TestingConfig


class RecordingProvider:
    def __init__(self, response='Provider response'):
        self.response = response
        self.calls = []

    def respond(self, session_id, messages):
        self.calls.append({
            'session_id': session_id,
            'messages': messages,
        })
        return self.response


class AgentApiTests(AppTestCase):
    def test_unconfigured_provider_returns_service_unavailable(self):
        response = self.client.post('/agent/api/respond', json={
            'session_id': 'test-session',
            'messages': [{'role': 'user', 'content': 'Hello'}],
        })

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.get_json()['error']['code'],
            'agent_not_configured',
        )

    def test_registered_provider_receives_normalized_history(self):
        provider = RecordingProvider('  Ready to help.  ')
        register_agent_provider(self.app, provider)

        response = self.client.post('/agent/api/respond', json={
            'session_id': 'test-session',
            'messages': [
                {'role': 'assistant', 'content': ' Previous response '},
                {'role': 'user', 'content': ' New request '},
            ],
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                'message': {
                    'role': 'assistant',
                    'content': 'Ready to help.',
                }
            },
        )
        self.assertEqual(provider.calls, [{
            'session_id': 'test-session',
            'messages': [
                {'role': 'assistant', 'content': 'Previous response'},
                {'role': 'user', 'content': 'New request'},
            ],
        }])

    def test_invalid_agent_requests_return_structured_errors(self):
        cases = (
            (
                {'session_id': 'invalid id', 'messages': [
                    {'role': 'user', 'content': 'Hello'},
                ]},
                'invalid_session_id',
            ),
            (
                {'session_id': 'valid-id', 'messages': []},
                'invalid_messages',
            ),
            (
                {'session_id': 'valid-id', 'messages': [
                    {'role': 'system', 'content': 'Hello'},
                ]},
                'invalid_message_role',
            ),
            (
                {'session_id': 'valid-id', 'messages': [
                    {'role': 'user', 'content': '   '},
                ]},
                'invalid_message_content',
            ),
            (
                {'session_id': 'valid-id', 'messages': [
                    {'role': 'assistant', 'content': 'Last message'},
                ]},
                'invalid_message_order',
            ),
        )

        for payload, expected_code in cases:
            with self.subTest(expected_code=expected_code):
                response = self.client.post('/agent/api/respond', json=payload)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(
                    response.get_json()['error']['code'],
                    expected_code,
                )

    def test_invalid_json_and_content_type_are_rejected(self):
        invalid_content_type = self.client.post(
            '/agent/api/respond',
            data='not-json',
        )
        invalid_json = self.client.post(
            '/agent/api/respond',
            data='{invalid',
            content_type='application/json',
        )

        self.assertEqual(invalid_content_type.status_code, 415)
        self.assertEqual(
            invalid_content_type.get_json()['error']['code'],
            'invalid_content_type',
        )
        self.assertEqual(invalid_json.status_code, 400)
        self.assertEqual(
            invalid_json.get_json()['error']['code'],
            'invalid_json',
        )

    def test_invalid_provider_contract_is_rejected(self):
        with self.assertRaises(TypeError):
            register_agent_provider(self.app, object())

    def test_companion_workspace_reflects_provider_state(self):
        unconfigured = self.client.get('/agent/companion/')

        self.assertEqual(unconfigured.status_code, 200)
        self.assertIn(b'id="companionApp"', unconfigured.data)
        self.assertIn(b'data-agent-configured="false"', unconfigured.data)
        self.assertIn(b'img/companion-nova.svg', unconfigured.data)

        register_agent_provider(self.app, RecordingProvider())
        configured = self.client.get('/agent/companion/')

        self.assertEqual(configured.status_code, 200)
        self.assertIn(b'data-agent-configured="true"', configured.data)

    def test_invalid_provider_response_returns_bad_gateway(self):
        responses = ('   ', 'x' * (MAX_AGENT_RESPONSE_LENGTH + 1))

        for provider_response in responses:
            with self.subTest(response_length=len(provider_response)):
                app = create_app(TestingConfig)
                register_agent_provider(
                    app,
                    RecordingProvider(provider_response),
                )
                response = app.test_client().post(
                    '/agent/api/respond',
                    json={
                        'session_id': 'test-session',
                        'messages': [{'role': 'user', 'content': 'Hello'}],
                    },
                )

                self.assertEqual(response.status_code, 502)
                self.assertEqual(
                    response.get_json()['error']['code'],
                    'invalid_agent_response',
                )


class McpRegistryTests(AppTestCase):
    def test_servers_are_registered_in_order_and_rendered(self):
        register_mcp_server(
            self.app,
            'workspace-files',
            'Workspace Files',
            transport='stdio',
            description='Workspace tools.',
        )
        register_mcp_server(
            self.app,
            'github-tools',
            'GitHub Tools',
            transport='streamable-http',
        )

        with self.app.app_context():
            servers = get_registered_mcp_servers()

        self.assertEqual(
            [server['id'] for server in servers],
            ['workspace-files', 'github-tools'],
        )

        response = self.client.get('/agent/mcps/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'id="mcp-runtime-workspace-files"', response.data)
        self.assertIn(b'id="mcp-runtime-github-tools"', response.data)

    def test_returned_registry_data_is_a_copy(self):
        register_mcp_server(self.app, 'files', 'Files')

        with self.app.app_context():
            first_read = get_registered_mcp_servers()
            first_read[0]['name'] = 'Changed'
            second_read = get_registered_mcp_servers()

        self.assertEqual(second_read[0]['name'], 'Files')

    def test_invalid_mcp_metadata_is_rejected(self):
        cases = (
            {
                'server_id': 'Invalid ID',
                'name': 'Invalid',
            },
            {
                'server_id': 'valid-id',
                'name': '',
            },
            {
                'server_id': 'valid-id',
                'name': 'Valid',
                'transport': 'websocket',
            },
            {
                'server_id': 'valid-id',
                'name': 'Valid',
                'description': 'x' * 241,
            },
        )

        for metadata in cases:
            with self.subTest(metadata=metadata):
                app = create_app(TestingConfig)
                with self.assertRaises(ValueError):
                    register_mcp_server(app, **metadata)

    def test_duplicate_mcp_id_is_rejected(self):
        register_mcp_server(self.app, 'files', 'Files')

        with self.assertRaises(ValueError):
            register_mcp_server(self.app, 'files', 'Other Files')
