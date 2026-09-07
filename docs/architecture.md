# Architecture

## Overview

WebApp Example uses Flask's application factory pattern with one blueprint per
feature area. Server-rendered Jinja templates provide the initial document,
while page-specific JavaScript adds local interaction.

```text
Browser
  |
  | HTTP request
  v
create_app()
  |
  +-- Flask-SQLAlchemy
  |     |
  |     `-- configured database
  |
  +-- Flask blueprint route
  |     |
  |     +-- optional feature data or integration
  |     |
  |     +-- render_template(...)
  |
  +-- Jinja base and shared partials
  |
  +-- page-specific CSS and JavaScript
```

## Repository structure

```text
WebAppExemple/
|-- .github/
|   |-- workflows/    Reusable quality, CI, and CD workflows
|   `-- dependabot.yml
|-- app/
|   |-- agent/        Chat and Companion workspaces, MCP overview, and registries
|   |-- api/          Swagger catalog and service detail routes
|   |-- chat/         Local conversation interface
|   |-- componentes/  Component showcase routes
|   |-- erros/        Error-page examples
|   |-- form/         Frontend form example
|   |-- kanji/        Kanji game and study data
|   |-- main/         Dashboard
|   |-- others/       Blank, chart, and table examples
|   |-- subscriptions/ Database model, validation, summaries, and CRUD routes
|   |-- user/         Login, registration, and recovery UI examples
|   |-- utilities/    Utility showcase routes
|   `-- __init__.py   Application factory and shared template context
|-- docs/             Project documentation and presentation images
|-- extensions/       Shared Flask-SQLAlchemy extension
|-- helpers/          Environment and configuration parsing helpers
|-- instance/         Local SQLite data at runtime; ignored by Git
|-- static/
|   |-- css/          Compiled theme and page-specific styles
|   |-- js/           Shared and page-specific interactions
|   |-- img/          Application assets
|   `-- vendor/       Bootstrap, Chart.js, Font Awesome, jQuery
|-- templates/
|   |-- partials/     Sidebar, top bar, footer, modals
|   |-- base.html     Shared document shell and extension blocks
|   `-- ...           Feature templates
|-- tests/            Standard-library unit and Flask integration tests
|-- .dockerignore     Runtime-focused Docker build context
|-- config.py         Flask configuration values and assembly
|-- dockerfile        Python 3.11 non-root runtime image
|-- main.py           Local entry point
`-- requirements.txt  Python dependencies
```

## Application factory

[`create_app`](../app/__init__.py) creates the Flask app, loads `Config`,
initializes Flask-SQLAlchemy, registers feature blueprints, creates the example
schema when needed, and injects shared template data.

Shared context currently includes:

- application name and current year
- Message Center conversations and unread count
- Swagger navigation services
- MCP runtime metadata

Blueprint URL prefixes keep feature boundaries explicit:

```python
app.register_blueprint(agent_bp, url_prefix="/agent")
app.register_blueprint(api_bp, url_prefix="/swagger")
app.register_blueprint(form_bp, url_prefix="/form")
app.register_blueprint(subscriptions_bp, url_prefix="/subscriptions")
```

## Template composition

[`templates/base.html`](../templates/base.html) owns global metadata, fonts,
vendor styles, theme styles, shared scripts, and page extension blocks.

Feature templates extend it and compose shared partials:

```jinja2
{% extends 'base.html' %}

{% block styles %}
<link href="{{ url_for('static', filename='css/example.css') }}" rel="stylesheet">
{% endblock %}

{% block content %}
{% include 'partials/_sidebar.html' %}
{% include 'partials/_topbar.html' %}
{% endblock %}

{% block scripts %}
<script src="{{ url_for('static', filename='js/example.js') }}"></script>
{% endblock %}
```

This pattern keeps page code focused while preserving navigation, footer, and
theme consistency.

## Database state

The shared SQLAlchemy object lives in [`extensions/db.py`](../extensions/db.py).
Subscription Management owns its model and domain calculations under
[`app/subscriptions/`](../app/subscriptions/).

With the default `sqlite:///app.db` URI, Flask-SQLAlchemy stores local data in
`instance/app.db`. The application calls `db.create_all()` during startup so a
fresh example works without an extra command. This creates missing tables but
does not migrate existing schemas; production deployments should introduce
versioned migrations before changing persisted models.

Tests replace the URI with `sqlite:///:memory:` so every application instance
uses an isolated, disposable database.

## Frontend state

Interactive demos use browser state where a backend has not yet been designed.

| Feature | Storage key | Stored data |
| --- | --- | --- |
| Theme | `sb-admin-theme` | Light or dark preference |
| Chat | `sb-admin-chat-messages` | Locally sent messages |
| Chat | `sb-admin-chat-selection` | Selected conversation |
| Agent / Chat | `sb-admin-agent-sessions` | Sessions and transcripts |
| Agent / Chat | `sb-admin-agent-selection` | Selected session |
| Agent / Companion | `sb-admin-companion-messages` | Locally added companion messages |
| Kanji | `sb-admin-kanji-preferences` | Set and sequence choices |

The form's selected files are intentionally kept only in memory and are lost
on refresh.

## Integration boundaries

The project separates interface examples from real integrations:

- Agent workspaces call a validated Flask endpoint only when a provider is registered.
- MCP registration stores navigation and overview metadata but starts no client.
- Swagger Hub reads configured URLs and does not report live service health.
- Form validation never sends field values or files to the server.
- Subscription Management stores local CRUD data but does not call a billing provider.

These boundaries are documented in [Integrations](./integrations.md).

## Test architecture

The suite uses Python's standard `unittest` framework and creates a fresh
Flask application for each integration test. [`tests/base.py`](../tests/base.py)
provides an isolated testing configuration, an in-memory database URI, and a
shared test client.

Tests are separated by responsibility:

- route and rendered-page smoke tests
- agent provider and MCP registry contracts
- Swagger catalog transformation
- configuration parsing and production safeguards
- Kanji dataset invariants
- subscription validation, persistence, summaries, and protected mutations

Run the full suite with:

```powershell
python -m unittest discover -s tests -v
```

The reusable [quality workflow](../.github/workflows/quality.yml) runs these
same commands in GitHub Actions. CI and CD call that workflow rather than
maintaining separate copies of the quality gate.

## Adding a feature

1. Create `app/<feature>/__init__.py` with a blueprint.
2. Add routes in `app/<feature>/routes.py`.
3. Add a feature-owned model and service layer when server persistence is needed.
4. Register the blueprint in `app/__init__.py`.
5. Add a feature template under `templates/<feature>/`.
6. Add page-specific CSS and JavaScript under `static/`.
7. Add navigation with endpoint-aware active state.
8. Validate the route, assets, persistence, responsive behavior, and both themes.

Use existing feature folders as implementation examples:

- [`app/form/`](../app/form/) for a frontend-only page
- [`app/subscriptions/`](../app/subscriptions/) for database-backed CRUD
- [`app/agent/`](../app/agent/) for a provider integration boundary
- [`app/api/`](../app/api/) for configuration-driven views
