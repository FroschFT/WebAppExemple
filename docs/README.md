# WebApp Example documentation

This directory contains the technical detail intentionally kept out of the
root [project presentation](../README.md).

WebApp Example is a Flask reference application for building modern internal
tools and product prototypes. It uses an application factory, feature
blueprints, Jinja templates, page-specific static assets, and a shared
responsive shell.

## Start here

| Guide | Use it for |
| --- | --- |
| [Getting started](./getting-started.md) | Install, run, configure, and troubleshoot the app |
| [Architecture](./architecture.md) | Understand the project structure and request flow |
| [Feature guide](./features.md) | Explore routes, behavior, and browser-persisted state |
| [Integrations](./integrations.md) | Connect an agent provider, register MCP metadata, or configure Swagger |
| [CI/CD](./ci-cd.md) | Understand quality checks, container publishing, and releases |

## Product surfaces

| Surface | Primary route | State model |
| --- | --- | --- |
| Dashboard | `/` | Server-rendered demo |
| Chat | `/chat/` | Browser-local messages |
| Agent / Chat | `/agent/` | Browser-local sessions plus optional server provider |
| Agent / Companion | `/agent/companion/` | Visual companion and shared provider conversation |
| MCP Overview | `/agent/mcps/` | Frontend examples plus runtime registration metadata |
| Swagger Hub | `/swagger/` | Application configuration |
| Kanji Challenge | `/kanji/` | In-memory game with browser preferences |
| Subscription Management | `/subscriptions/` | SQLAlchemy-backed recurring costs |
| Form Example | `/form/` | Frontend-only validation and files |
| Charts | `/others/charts` | Chart.js demos |

## Project intent

The repository demonstrates how a Flask application can grow beyond a basic
dashboard without becoming a single monolithic template. Each feature owns its
route, templates, data, styles, and scripts while reusing the global
navigation, top bar, footer, theme, and responsive behavior.

Some surfaces are deliberately frontend-only:

- Chat messages and Agent workspace sessions use `localStorage`.
- The form validates fields and files but does not upload or submit them.
- MCP registration currently exposes metadata; it does not start MCP clients.
- Swagger Hub reads configured documentation URLs but does not probe service health.
- Authentication screens are interface examples, not a complete auth system.

These boundaries keep the example honest and make the next server-side
integration points easy to identify.

## Screenshots

Presentation assets live in [`docs/img/`](./img/):

- [`app-home-light.png`](./img/app-home-light.png)
- [`app-home-dark.png`](./img/app-home-dark.png)
- [`app-agent-chat.png`](./img/app-agent-chat.png)
- [`app-kanji-challenge.png`](./img/app-kanji-challenge.png)

## Credits

WebApp Example adapts
[SB Admin 2](https://startbootstrap.com/theme/sb-admin-2) on
[SB Admin 2 - GitHub](https://github.com/startbootstrap/startbootstrap-sb-admin-2) by
[Start Bootstrap](https://startbootstrap.com/). See the root
[MIT License](../LICENSE) for retained copyright and license notices.
