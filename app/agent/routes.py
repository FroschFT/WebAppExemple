import re

from flask import jsonify, render_template, request
from werkzeug.exceptions import BadRequest

from app.agent import bp
from app.agent.mcp_examples import MCP_EXAMPLE_SERVERS
from app.agent.service import (
    AgentNotConfiguredError,
    InvalidAgentResponseError,
    get_registered_mcp_servers,
    is_agent_provider_configured,
    request_agent_response,
)


MAX_HISTORY_LENGTH = 100
MAX_MESSAGE_LENGTH = 10000
SESSION_ID_PATTERN = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$')

SESSIONS = (
    {
        'id': 'project-onboarding',
        'title': 'Project onboarding',
        'preview': 'A good starting point is the application structure.',
        'time': '9:36 AM',
        'date_label': 'Today',
        'messages': (
            {
                'role': 'assistant',
                'content': (
                    'Welcome to Agent Chat. Once a provider is connected, I can '
                    'help explore this project, plan changes, and work through '
                    'implementation tasks.'
                ),
                'time': '9:32 AM',
            },
            {
                'role': 'user',
                'content': 'What can we work on in this workspace?',
                'time': '9:34 AM',
            },
            {
                'role': 'assistant',
                'content': (
                    'A good starting point is the application structure. We can '
                    'review a feature, trace a bug, or plan the next integration.'
                ),
                'time': '9:36 AM',
            },
        ),
    },
    {
        'id': 'dark-mode-review',
        'title': 'Dark mode review',
        'preview': 'The theme now covers shared dashboard components.',
        'time': 'Yesterday',
        'date_label': 'Yesterday',
        'messages': (
            {
                'role': 'user',
                'content': 'Review the dark mode coverage for the dashboard.',
                'time': 'Yesterday, 3:10 PM',
            },
            {
                'role': 'assistant',
                'content': (
                    'The theme now covers shared dashboard components, including '
                    'cards, forms, tables, dropdowns, and responsive navigation.'
                ),
                'time': 'Yesterday, 3:12 PM',
            },
        ),
    },
    {
        'id': 'message-center-integration',
        'title': 'Message Center integration',
        'preview': 'Conversation previews now deep-link into Chat.',
        'time': 'Aug 31',
        'date_label': 'August 31',
        'messages': (
            {
                'role': 'user',
                'content': 'Connect the top-bar messages to the Chat page.',
                'time': 'August 31, 4:22 PM',
            },
            {
                'role': 'assistant',
                'content': (
                    'Conversation previews now deep-link into Chat and preserve '
                    'the selected thread on both desktop and mobile.'
                ),
                'time': 'August 31, 4:25 PM',
            },
        ),
    },
)

COMPANION_MESSAGES = (
    {
        'role': 'assistant',
        'content': (
            'Hello, I am Nova. This workspace is a visual prototype for a more '
            'expressive companion experience.'
        ),
        'time': '10:00 AM',
    },
    {
        'role': 'user',
        'content': 'What can we do here?',
        'time': '10:01 AM',
    },
    {
        'role': 'assistant',
        'content': (
            'We can chat through the same agent provider while the portrait and '
            'voice panels show where animated and audio experiences can be added.'
        ),
        'time': '10:01 AM',
    },
)


def error_response(code, message, status_code):
    return jsonify({
        'error': {
            'code': code,
            'message': message,
        }
    }), status_code


def validate_response_request(payload):
    if not isinstance(payload, dict):
        return None, error_response(
            'invalid_request',
            'The request body must be a JSON object.',
            400,
        )

    session_id = payload.get('session_id')
    if not isinstance(session_id, str) or not SESSION_ID_PATTERN.fullmatch(session_id):
        return None, error_response(
            'invalid_session_id',
            'The session ID is missing or invalid.',
            400,
        )

    messages = payload.get('messages')
    if not isinstance(messages, list) or not 1 <= len(messages) <= MAX_HISTORY_LENGTH:
        return None, error_response(
            'invalid_messages',
            'Messages must be a non-empty JSON array of supported length.',
            400,
        )

    normalized_messages = []
    for index, message in enumerate(messages):
        if not isinstance(message, dict):
            return None, error_response(
                'invalid_message',
                'Message {} must be a JSON object.'.format(index),
                400,
            )

        role = message.get('role')
        content = message.get('content')

        if role not in ('user', 'assistant'):
            return None, error_response(
                'invalid_message_role',
                'Message {} has an unsupported role.'.format(index),
                400,
            )

        if (
            not isinstance(content, str)
            or not content.strip()
            or len(content) > MAX_MESSAGE_LENGTH
        ):
            return None, error_response(
                'invalid_message_content',
                'Message {} has missing or invalid content.'.format(index),
                400,
            )

        normalized_messages.append({
            'role': role,
            'content': content.strip(),
        })

    if normalized_messages[-1]['role'] != 'user':
        return None, error_response(
            'invalid_message_order',
            'The final message must be from the user.',
            400,
        )

    return {
        'session_id': session_id,
        'messages': normalized_messages,
    }, None


@bp.route('/')
def index():
    sessions = [
        dict(session, messages=list(session['messages']))
        for session in SESSIONS
    ]

    return render_template(
        'agent/index.html',
        sessions=sessions,
        active_session=sessions[0],
        agent_configured=is_agent_provider_configured(),
    )


@bp.route('/companion/')
def companion():
    return render_template(
        'agent/companion.html',
        companion_messages=COMPANION_MESSAGES,
        agent_configured=is_agent_provider_configured(),
    )


@bp.route('/mcps/')
def mcp_overview():
    registered_servers = get_registered_mcp_servers()
    transports = sorted({
        server['transport']
        for server in MCP_EXAMPLE_SERVERS
    })
    statuses = sorted({
        server['status']
        for server in MCP_EXAMPLE_SERVERS
    })

    return render_template(
        'agent/mcp_overview.html',
        example_servers=MCP_EXAMPLE_SERVERS,
        registered_servers=registered_servers,
        transports=transports,
        statuses=statuses,
        example_tool_count=sum(
            len(server['tools'])
            for server in MCP_EXAMPLE_SERVERS
        ),
    )


@bp.route('/api/respond', methods=['POST'])
def respond():
    if not request.is_json:
        return error_response(
            'invalid_content_type',
            'The request must use the application/json content type.',
            415,
        )

    try:
        payload = request.get_json()
    except BadRequest:
        return error_response(
            'invalid_json',
            'The request body contains invalid JSON.',
            400,
        )

    validated_request, validation_error = validate_response_request(payload)

    if validation_error:
        return validation_error

    try:
        content = request_agent_response(
            validated_request['session_id'],
            validated_request['messages'],
        )
    except AgentNotConfiguredError:
        return error_response(
            'agent_not_configured',
            'No agent provider is connected yet.',
            503,
        )
    except InvalidAgentResponseError:
        return error_response(
            'invalid_agent_response',
            'The agent provider returned an invalid response.',
            502,
        )

    return jsonify({
        'message': {
            'role': 'assistant',
            'content': content,
        }
    })
