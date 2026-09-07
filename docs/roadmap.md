**Plan: Polish the Showcase Starter**
The recommended direction is a frontend-led refresh that keeps the application illustrative while making it credible as a Flask starter.

**Steps**
1. Add baseline pytest coverage for page routes, the Agent API validation contract, provider registration, MCP metadata, and Swagger catalog construction.

2. Refactor `base.html:1` into a valid document layout and introduce shared dashboard/auth layouts. This removes duplicated wrappers and the confirmed nested `<body>` elements.

3. Rework the global shell in `_sidebar.html:1` and `_topbar.html:1`:
   - ~~Rebrand it as WebApp Example.~~
   - Remove ~~the SB Admin upsell~~, fake alerts, global search, profile, and logout actions.
   - Preserve the message-center links, theme toggle, dynamic APIs, and registered MCPs.
   - ~~Correct accordion semantics and mobile navigation.~~

4. Replace the stock revenue dashboard in `index.html:1` with a real catalog of the included examples. Each entry will clearly identify behavior such as `Browser-local`, `Provider optional`, or `Config-driven`.

5. Consolidate repeated headings, badges, metrics, panels, filters, empty states, and focus styling into shared component CSS. Keep the distinctive layouts in the existing feature stylesheets.

6. Complete the responsive and accessibility pass:
   - Fix Chat’s short-screen viewport behavior in `chat.css:59`.
   - Add skip navigation and consistent main landmarks.
   - Improve form validation announcements and focus management.
   - Turn the login/register/password pages into clearly labeled static previews rather than simulated authentication.
   - Test keyboard use, reduced motion, light/dark themes, and widths from 320px upward.


7. ~~Harden `config.py:1`:~~
   - ~~Make `ENVIRONMENT` the only supported environment setting.~~
   - ~~Stop forcing debug mode.~~
   - ~~Require a production secret while retaining convenient development setup.~~
   - ~~Move Swagger URLs into testable application configuration.~~
   - ~~Add `.env.example`.~~


8. Clean up and deploy reliably:
   - Convert `requirements.txt` from UTF-16LE to UTF-8 and retain only direct dependencies.
   - Remove unused ~~Flask-RESTPlus~~, Flask-RESTX, and dormant legacy model files; retain SQLAlchemy for persisted features.
   - ~~Replace the duplicate development-server container in `dockerfile:1` with one Python 3.11 slim stage, non-root execution, and Gunicorn~~, and add `/healthz`.
   - Add real 404/500 handling and remove the ad hoc `/test/` route.

9. Add Ruff, coverage, Playwright, axe accessibility checks, responsive screenshots, and GitHub Actions. Node remains development-only and will not become a frontend build requirement.

**Verification**
- `python -m pytest --cov=app`
- `python -m ruff check .`
- `python -m ruff format --check .`
- `python -m pip check`
- Playwright at 1440×900, 768×1024, 390×844, and 320×568
- No serious or critical axe violations
- Successful Docker build, Gunicorn startup, and `/healthz` response
- Manual keyboard and NVDA checks across Home, Chat, Form, and one catalog page

**Decisions**
- Keep Bootstrap 4, Jinja, vanilla JavaScript, and existing browser-local state.
- Do not add real authentication, persistence, a default AI provider, live MCP execution, or live OpenAPI probing.
- Remove the inactive database scaffold instead of enabling unused infrastructure.
- ~~Preserve SB Admin attribution in documentation, but stop presenting it as the application’s identity.~~