# Feature guide

## Core experiences

### Dashboard

**Route:** `/`

The dashboard demonstrates summary cards, Chart.js visualizations, responsive
navigation, Message Center previews, and the global theme switch.

![Dashboard in light mode](./img/app-home-light.png)

### Chat

**Route:** `/chat/`

Chat provides:

- searchable conversations
- deep links from the top-bar Message Center
- local message composition and persistence
- unread and presence indicators
- responsive conversation/thread navigation
- session-safe scrolling for long transcripts

This is a browser-local interaction example. Messages are not sent to another
user or persisted on the server.

### Agent / Chat workspace

**Route:** `/agent/`

The Chat workspace under Agent replaces contacts with persistent work sessions:

- create, search, rename, and delete sessions
- automatically name a new session from its first prompt
- preserve session transcripts in the browser
- show provider connection and error states
- prevent deleting a session during an in-flight response
- connect to a replaceable server-side agent provider

![Agent workspace with chat sessions](./img/app-agent-chat.png)

### Agent / Companion workspace

**Route:** `/agent/companion/`

Companion keeps the agent conversation on the right and replaces the session
list with a visual presence panel:

- a local static portrait for Nova occupying two-thirds of the left column
- a voice waveform placeholder occupying one-third
- mobile portrait-to-chat navigation
- browser-local companion messages
- the same validated agent provider endpoint as Chat
- brief simulated waveform activity after a provider response

The portrait is static and no audio is generated. Those panels reserve the
future avatar animation and voice integration points without pretending they
already exist.

### MCP Overview

**Route:** `/agent/mcps/`

The MCP overview explains the flow from agent to tools and provides:

- three frontend example servers
- tool, capability, status, and transport metadata
- search and filters
- expandable illustrative tool lists
- the real Flask runtime MCP metadata registry

The example cards make no MCP calls. Runtime entries appear only after
`register_mcp_server(...)` is called.

### Swagger Hub

**Route:** `/swagger/`

Swagger Hub builds an API catalog from configured HTTP or HTTPS documentation
URLs:

- service metrics and metadata
- search, environment, and status filters
- service detail pages
- copy and external-open actions
- illustrative operations for known services
- registered-service quick links in the sidebar

`Configured` means a valid URL exists in configuration. The page does not make
a health request.

### Kanji Challenge

**Route:** `/kanji/`

The Kanji game includes:

- `T1` through `T5` and combined study sets
- ordered and no-repeat random rounds
- reading and meaning reveal
- progress and restart controls
- Space and Right Arrow keyboard shortcuts
- browser-persisted game preferences

![Kanji Challenge](./img/app-kanji-challenge.png)

### Form Example

**Route:** `/form/`

The form showcases:

- title, email, and request type fields
- inline calendar with keyboard navigation
- drag-and-drop or file-picker attachments
- duplicate, file-size, and file-count validation
- removable file rows
- browser-only validation and reset

Successful validation explicitly reports that no data was sent.

### Subscription Management

**Route:** `/subscriptions/`

Subscription Management is the first database-backed product workflow:

- add a name, USD value, and weekly, monthly, quarterly, or yearly recurrence
- persist records through Flask-SQLAlchemy in the configured database
- normalize mixed billing cycles into monthly and annual projections
- show billing-cycle distribution and individual annualized costs
- validate money and recurrence values on the server
- protect create and delete forms with a session-backed form token
- remove saved subscriptions

The default SQLite database is suitable for this reference app. The feature
does not connect to billing providers, charge payment methods, perform currency
conversion, or separate data by user.

### Charts and tables

| Route | Contents |
| --- | --- |
| `/others/charts` | Area, bar, donut, and radar/spider charts |
| `/others/tables` | Responsive DataTables example |

The radar chart compares two six-dimension profiles and updates its labels,
grid, legend, and tooltips when the theme changes.

## UI showcase routes

| Area | Routes |
| --- | --- |
| Components | `/componentes/buttons/`, `/componentes/cards/` |
| Utilities | `/utilities/utilities-color/`, `/utilities/utilities-border/`, `/utilities/utilities-animation/`, `/utilities/utilities-other/` |
| User interface | `/user/`, `/user/register`, `/user/forgot-password` |
| Other | `/others/`, `/erros/404` |

## Shared interface behavior

All primary feature pages reuse:

- responsive sidebar navigation
- top-bar search, notifications, messages, profile, and theme control
- light and dark palettes
- reusable cards, dropdowns, modals, buttons, and forms
- mobile layouts without horizontal overflow
- accessible labels, status regions, focus states, and reduced-motion support

## Demo boundaries

| Surface | Implemented | Intentionally not implemented |
| --- | --- | --- |
| Chat | Local UI and persistence | Realtime messaging backend |
| Agent workspaces | Chat sessions, Companion UI, and provider endpoint | Default AI, avatar, or voice provider |
| MCP | Metadata registry and examples | MCP client lifecycle |
| Subscriptions | Persisted CRUD and recurring-cost summaries | Billing provider, payments, multi-currency, or user ownership |
| Form | Browser validation and file selection | Upload and persistence |
| Swagger | Configured catalog | Health probing and spec ingestion |
| User screens | Interface examples | Authentication and authorization |

See [Integrations](./integrations.md) for the supported extension points.
