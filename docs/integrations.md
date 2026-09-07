# Integrations

## Agent provider

The Agent → Chat and Companion workspaces post normalized conversations to
`/agent/api/respond`. The application returns `503 agent_not_configured` until
a provider is registered.

Create a small launcher for local integration:

```python
from app import create_app
from app.agent import register_agent_provider


class MyAgentProvider:
    def respond(self, session_id, messages):
        latest_message = messages[-1]["content"]
        return "Received: {}".format(latest_message)


app = create_app()
register_agent_provider(app, MyAgentProvider())

if __name__ == "__main__":
    app.run(port=8081)
```

Provider contract:

```python
respond(session_id: str, messages: list[dict]) -> str
```

Rules enforced by the current implementation:

- `session_id` uses letters, numbers, hyphens, or underscores.
- history contains 1 to 100 messages.
- roles are `user` or `assistant`.
- each message is non-empty and at most 10,000 characters.
- the final message must have role `user`.
- the provider returns a non-empty string up to 10,000 characters.

The provider call is synchronous. A production integration should decide how
to handle timeouts, cancellation, streaming, observability, and provider
errors before deployment.

## MCP metadata registry

MCP registration currently powers the Integrations sidebar and the runtime
section of `/agent/mcps/`.

```python
from app import create_app
from app.agent import register_mcp_server

app = create_app()

register_mcp_server(
    app,
    "workspace-files",
    "Workspace Files",
    transport="stdio",
    description="Tools for files in the current workspace.",
)
```

Supported transport labels:

- `stdio`
- `streamable-http`
- `sse`

Registration validates IDs, display names, transport labels, descriptions,
and duplicates. The registry preserves registration order.

> [!IMPORTANT]
> `register_mcp_server` stores display metadata only. It does not launch a
> process, connect to a remote MCP server, discover tools, or expose those
> tools to the agent provider.

To implement real MCP support, add a client lifecycle that:

1. starts or connects to configured servers
2. performs MCP initialization
3. discovers and validates tools
4. makes tools available to the agent provider
5. enforces authorization and workspace boundaries
6. closes transports during application shutdown

## Swagger catalog

Swagger documentation URLs are held in Flask application configuration. The
environment-specific defaults and JSON parsing live in
[`helpers/configuration.py`](../helpers/configuration.py), then
[`config.py`](../config.py) assembles the Flask setting:

```python
class Config:
    ENVIRONMENT = get_environment()
    SWAGGER_URLS = get_swagger_urls(ENVIRONMENT)
```

Local deployments can replace the complete mapping with JSON in `.env`:

```dotenv
SWAGGER_URLS={"FROSCH_KANJI_BACK":"http://127.0.0.1:8084/swagger"}
```

Process environment values take precedence over `.env`. Tests can instead
provide a config class with their own `ENVIRONMENT` and `SWAGGER_URLS` values
to `create_app`, without mutating global environment state.

Configuration requires named, non-empty entries. The catalog displays entries
with valid HTTP or HTTPS URLs and ignores unsupported URL schemes.

Known services can receive richer presentation metadata in
[`app/api/catalog.py`](../app/api/catalog.py), including:

- stable service ID
- display name and description
- owner and version
- authentication label
- tags
- illustrative operations

Unknown valid entries still appear with generated names and generic metadata.

Swagger Hub routes:

| Route | Purpose |
| --- | --- |
| `/swagger/` | Searchable service catalog |
| `/swagger/services/<service-id>/` | Service detail page |

Catalog status is configuration-based. If live health is needed later, add an
explicit health service with timeouts and error states rather than making
blocking network calls while rendering templates.

## Form submission

`/form/` currently has no POST route. The browser:

- validates required fields and email shape
- manages the selected date
- checks duplicate files, 10 MB size, and five-file count limits
- displays a local success summary

Before adding a backend:

1. define the request schema and persistence model
2. add CSRF protection
3. repeat every client validation on the server
4. sanitize filenames and avoid trusting MIME types
5. enforce total request and per-file limits
6. store files outside the public static directory
7. add authorization and audit logging

## Chat backend

`/chat/` uses seeded conversations and `localStorage`. A server-side version
will need:

- authenticated users and conversations
- durable messages
- authorization per conversation
- pagination for long histories
- realtime delivery or polling
- unread state synchronized on the server
- attachment security if file sharing is added

Keep the current frontend data shape stable or introduce a versioned API
adapter when connecting the interface.
