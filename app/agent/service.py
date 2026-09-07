import re

from flask import current_app


AGENT_PROVIDER_EXTENSION_KEY = 'agent_provider'
MCP_SERVERS_EXTENSION_KEY = 'agent_mcp_servers'
MAX_AGENT_RESPONSE_LENGTH = 10000
MCP_SERVER_ID_PATTERN = re.compile(r'^[a-z0-9][a-z0-9_-]{0,63}$')
SUPPORTED_MCP_TRANSPORTS = ('stdio', 'streamable-http', 'sse')


class AgentNotConfiguredError(RuntimeError):
    pass


class InvalidAgentResponseError(RuntimeError):
    pass


def register_agent_provider(app, provider):
    respond = getattr(provider, 'respond', None)

    if not callable(respond):
        raise TypeError('The agent provider must define a callable respond method.')

    app.extensions[AGENT_PROVIDER_EXTENSION_KEY] = provider
    return provider


def register_mcp_server(
    app,
    server_id,
    name,
    *,
    transport='stdio',
    description='',
):
    if not isinstance(server_id, str) or not MCP_SERVER_ID_PATTERN.fullmatch(server_id):
        raise ValueError(
            'The MCP server ID must contain lowercase letters, numbers, hyphens, '
            'or underscores and be at most 64 characters.'
        )

    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 80:
        raise ValueError('The MCP server name must contain 1 to 80 characters.')

    if transport not in SUPPORTED_MCP_TRANSPORTS:
        raise ValueError(
            'The MCP transport must be one of: {}.'.format(
                ', '.join(SUPPORTED_MCP_TRANSPORTS)
            )
        )

    if not isinstance(description, str) or len(description.strip()) > 240:
        raise ValueError(
            'The MCP server description must contain at most 240 characters.'
        )

    registry = app.extensions.setdefault(MCP_SERVERS_EXTENSION_KEY, {})

    if server_id in registry:
        raise ValueError(
            'An MCP server with ID {!r} is already registered.'.format(server_id)
        )

    server = {
        'id': server_id,
        'name': name.strip(),
        'transport': transport,
        'description': description.strip(),
    }
    registry[server_id] = server

    return dict(server)


def get_registered_mcp_servers():
    registry = current_app.extensions.get(MCP_SERVERS_EXTENSION_KEY, {})
    return tuple(dict(server) for server in registry.values())


def is_agent_provider_configured():
    return AGENT_PROVIDER_EXTENSION_KEY in current_app.extensions


def request_agent_response(session_id, messages):
    provider = current_app.extensions.get(AGENT_PROVIDER_EXTENSION_KEY)

    if provider is None:
        raise AgentNotConfiguredError('No agent provider has been registered.')

    response = provider.respond(
        session_id=session_id,
        messages=[dict(message) for message in messages],
    )

    if not isinstance(response, str) or not response.strip():
        raise InvalidAgentResponseError(
            'The agent provider returned an empty or invalid response.'
        )

    response = response.strip()

    if len(response) > MAX_AGENT_RESPONSE_LENGTH:
        raise InvalidAgentResponseError(
            'The agent provider response exceeded the supported length.'
        )

    return response
