# Getting started

## Requirements

- Python 3.11 or a compatible Python 3 release
- `pip`
- A modern browser
- Optional: Docker

The application listens on port `8081`.

## Local installation

From the repository root, create an isolated environment.

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python main.py
```

### macOS or Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
python main.py
```

Open [http://127.0.0.1:8081](http://127.0.0.1:8081).

## Run with Docker

The Docker configuration exposes the same port:

```bash
docker build -f dockerfile -t webapp-example .
docker run --rm -p 8081:8081 \
  -e SECRET_KEY=replace-with-a-random-production-secret \
  webapp-example
```

Open [http://127.0.0.1:8081](http://127.0.0.1:8081).

The image runs Gunicorn as the unprivileged `app` user with two workers and
four threads per worker. Access and error logs are written to container stdout
and stderr. The HTTP health check currently targets `/`, and production startup
requires `SECRET_KEY`, as shown above.

`python main.py` remains the local development command. Production containers
load the application from [`wsgi.py`](../wsgi.py) through `gunicorn wsgi:app`.

## Configuration

Application values are assembled in [`config.py`](../config.py). Environment,
debug, and Swagger parsing live in
[`helpers/configuration.py`](../helpers/configuration.py).

| Setting | Purpose | Default behavior |
| --- | --- | --- |
| `APP_NAME` | Shared application name | `WebApp Example` |
| `ENVIRONMENT` | Runtime environment | `development`; accepts `dev`, `prod`, `prd`, and `test` aliases |
| `DEBUG` | Flask debugger and reloader | `false`; `.env.example` enables it for local development |
| `SECRET_KEY` | Flask signing key | Development-only fallback locally; required in production |
| `SWAGGER_URLS` | Named Swagger URLs as a JSON object | Local Frosch Kanji URL in development |
| `DATABASE_URI` | SQLAlchemy connection URI | `sqlite:///app.db` in the Flask instance folder |

> [!IMPORTANT]
> Set a unique `SECRET_KEY` before using `ENVIRONMENT=production`. Application
> creation fails rather than starting production with an unsigned session key.

The application loads `.env` from the repository root for local development.
Existing process environment variables take precedence. `ENVIRONMENT` is the
only supported setting name for selecting the runtime environment.

Swagger documentation endpoints are stored in Flask application configuration,
so tests can replace `SWAGGER_URLS` without changing process state. See
[Integrations](./integrations.md#swagger-catalog) for details.

## Database

Subscription Management uses Flask-SQLAlchemy and creates its table on
application startup. With the default URI, records are stored in
`instance/app.db`; the `instance/` directory is excluded from Git.

Set `DATABASE_URI` to use another SQLAlchemy-compatible database. Automatic
table creation keeps local setup simple, but it is not a schema migration
system. Introduce versioned migrations before evolving the model in a
production deployment, and use persistent storage when running the container.

## Development commands

Compile all application Python files:

```powershell
python -m compileall -q -f app extensions helpers main.py config.py
```

Start the development server:

```powershell
python main.py
```

## Automated tests

Run the complete dependency-free suite from the repository root:

```powershell
python -m unittest discover -s tests -v
```

The tests use Python's standard `unittest` package and Flask's test client.
They are grouped by concern:

| Module | Coverage |
| --- | --- |
| `test_routes.py` | Feature pages, assets, deep links, redirects, and methods |
| `test_agent.py` | Agent API, provider contract, and MCP registry |
| `test_catalog.py` | Swagger catalog metadata and filtering |
| `test_configuration.py` | Environment, debug, Swagger, and production validation |
| `test_kanji_data.py` | Kanji counts, levels, uniqueness, and required fields |
| `test_subscriptions.py` | Database writes, validation, recurrence summaries, CSRF, and deletion |

Run one module while iterating:

```powershell
python -m unittest tests.test_agent -v
```

Compile and test together:

```powershell
python -m compileall -q -f app extensions helpers main.py config.py
python -m unittest discover -s tests -v
```

Frontend behavior still benefits from live-browser validation for responsive
layout, drag and drop, charts, and light/dark theme changes.

GitHub runs the same compile and test commands before validating or publishing
the container. See [CI/CD](./ci-cd.md).

## Troubleshooting

### `python` is not found on Windows

Use the full interpreter path installed on the machine, for example:

```powershell
& C:\ProgramData\anaconda3\python.exe main.py
```

### Port 8081 is already in use

Stop the existing process that owns the port or run the app from a custom
launcher on another port.

### A Swagger link does not open

Swagger Hub lists configured URLs without making a health request. Confirm the
target service is running and that its URL in `SWAGGER_URLS` is reachable from
the browser.

### An Agent workspace says the provider is not connected

That is the expected default. Register a provider before starting the server;
see [Agent provider](./integrations.md#agent-provider).

## Next steps

- Read the [architecture guide](./architecture.md).
- Browse the [feature map](./features.md).
- Configure [agent, MCP, or Swagger integrations](./integrations.md).
