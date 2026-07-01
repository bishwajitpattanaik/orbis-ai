# Orbis

> Set your ideas in motion with Orbis, AI that lives on your terminal.

A production-deployed, AI-powered command-line companion built with Bun, TypeScript, and the Vercel AI SDK — ask questions, run autonomous agent tasks, and plan complex work, all from a single CLI, with a Telegram bridge for when you're away from your machine.

📦 **Install:** `npm install -g @orbis-ai/orbis`
🌐 **Web Console:** [orbis-ai-bishwajitpattanaik.vercel.app](https://orbis-ai-bishwajitpattanaik.vercel.app/)

---

## 💻 Tech Stack

**CLI**

| Technology | Purpose |
|---|---|
| Bun | Runtime — fast cold starts for a CLI tool |
| TypeScript | Type safety across CLI and backend |
| Vercel AI SDK | Model-agnostic AI integration |
| Commander.js | CLI command parsing |

**Backend**

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | Web framework / API server |
| OAuth 2.0 Device Flow | CLI authentication |

**Cloud Services**

| Service | Purpose |
|---|---|
| Render | Backend API hosting |
| Vercel | Web client hosting (OAuth approval screen) |
| npm Registry | CLI package distribution (`@orbis-ai/orbis`) |
| Telegram Bot API | Mobile access to the same backend |

---

## ✨ Features

**🧠 Ask Mode**
- Fast, single-shot questions and answers
- No session setup — just ask and get a terminal-rendered response

**🤖 Agent Mode**
- Describe a goal in plain language
- Orbis autonomously reads/writes files and executes steps to complete it

**📋 Plan Mode**
- Step-by-step plan generated before any changes are made
- Useful for reviewing an approach before committing to it

**📱 Telegram Mode**
- Same AI backend, accessible from a Telegram chat
- Check on tasks or ask questions away from your machine

**🔐 Auth**
- OAuth 2.0 Device Authorization flow (same pattern as the GitHub CLI)
- Bring-your-own API key — usage and cost stay under your control

---

## 🚀 Deployment Architecture

```
                         Developer Terminal
                                │
                                ▼
                 ┌──────────────────────────┐
                 │   Orbis CLI (Bun + TS)    │
                 │  npm i -g @orbis-ai/orbis │
                 └────────────┬─────────────┘
                              │ HTTPS API calls
                              │ device-flow auth token
                              ▼
                 ┌──────────────────────────┐
                 │     Render (Backend)      │
                 │   Node.js + Express API   │
                 │   /auth   /ask  /agent    │
                 └────────────┬─────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
  ┌─────────────────┐ ┌───────────────┐ ┌──────────────────┐
  │  Web Client       │ │  AI Provider   │ │  Telegram Bot API │
  │  (Vercel)          │ │ (via AI SDK)   │ │                    │
  │  OAuth approval     │ └───────────────┘ └──────────────────┘
  └─────────────────┘
```

| Layer | Platform | URL |
|---|---|---|
| CLI | npm | [@orbis-ai/orbis](https://www.npmjs.com/package/@orbis-ai/orbis) |
| Backend | Render | API server |
| Web Client | Vercel | [orbis-ai-rose.vercel.app](https://orbis-ai-rose.vercel.app) |
| Bot | Telegram | Telegram Bot API |

**Architecture:**
- The CLI is published to npm and runs locally on Bun, calling the backend for every AI request.
- The Express backend, hosted on **Render**, handles auth, mode routing, and calls out to the configured AI provider via the **Vercel AI SDK**.
- Authentication uses the **OAuth Device Authorization Grant** — the CLI requests a code, the developer approves it in the browser via the Vercel-hosted web client, and the CLI polls for the resulting token.
- The **Telegram bot** talks to the same backend, giving a second front-end onto the same AI logic.

---

## 📁 Project Structure

```
orbis-core/
│
├── client/                         # Web client (OAuth device approval UI)
│
├── orbis/                          # CLI package (published to npm)
│   ├── ai/
│   │   ├── ai.config.ts            # AI provider configuration
│   │   └── index.ts
│   │
│   ├── auth/
│   │   ├── login.ts                # OAuth device flow — initiate login
│   │   ├── logout.ts                # Clear stored credentials
│   │   ├── token.ts                 # Token storage & refresh
│   │   ├── user.ts                  # User session helpers
│   │   └── whoami.ts                # Display current authenticated user
│   │
│   ├── modes/
│   │   ├── agent/                   # Agent mode — autonomous task execution
│   │   │   ├── action-tracker.ts    # Tracks actions taken during a run
│   │   │   ├── agent-tools.ts       # Tool definitions available to the agent
│   │   │   ├── approval.ts          # Human-in-the-loop approval gating
│   │   │   ├── diff-view.ts         # Renders file diffs before applying
│   │   │   ├── orchestrator.ts      # Agent run loop / control flow
│   │   │   ├── tool-executor.ts     # Executes tool calls
│   │   │   └── types.ts
│   │   │
│   │   ├── ask/                     # Ask mode — single-shot Q&A
│   │   │   └── orchestrator.ts
│   │   │
│   │   ├── plan/                    # Plan mode — step-by-step planning
│   │   │   ├── orchestrator.ts
│   │   │   ├── planner.ts           # Generates the plan
│   │   │   ├── selection.ts         # Step selection / approval logic
│   │   │   ├── types.ts
│   │   │   └── web-tools.ts         # Web lookups used during planning
│   │   │
│   │   └── telegram/                # Telegram mode — mobile bridge
│   │       ├── agent-run.ts         # Runs agent tasks from Telegram
│   │       ├── approval-session.ts  # Approval flow over Telegram
│   │       ├── auth.ts              # Telegram-side auth linking
│   │       ├── constants.ts
│   │       ├── handlers.ts          # Telegram message/command handlers
│   │       ├── index.ts
│   │       ├── plan-session.ts      # Plan mode over Telegram
│   │       └── text.ts              # Message formatting helpers
│   │
│   ├── prisma/                      # Database schema & migrations
│   │
│   ├── services/
│   │   └── chat.service.ts          # Shared chat/session business logic
│   │
│   ├── tui/                         # Terminal UI layer
│   │   ├── init.ts                 # TUI bootstrap
│   │   ├── terminal-md.ts          # Markdown rendering in-terminal
│   │   └── wakeup.ts               # Interactive mode-selection menu
│   │
│   ├── cli.ts                       # CLI entry point
│   ├── index.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── bun.lock
│   ├── tsconfig.json
│   ├── README.md
│   ├── .gitignore
│   └── .npmignore
│
└── server/                          # Backend API
    ├── README.md
    └── .gitignore
```

---

## ⚙️ Setup & Installation

### 🔧 Backend

**1. Clone the repository**

```bash
git clone https://github.com/bishwajitpattanaik/orbis-ai.git
cd orbis-ai
```

**2. Install backend dependencies**

```bash
cd server
npm install
```

**3. Configure environment variables**

Create a `.env` file inside the `server` folder:

```env
PORT=3001
CLIENT_URL=http://localhost:3000
AI_PROVIDER_API_KEY=your_provider_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

**4. Start the backend server**

```bash
npm run dev
```

> Server runs on `http://localhost:3001`

---

### 🎨 Web Client

**5. Install client dependencies**

```bash
cd ../client
npm install
```

**6. Start the client**

```bash
npm run dev
```

> Client runs on `http://localhost:3000`

---

### 🖥️ CLI

**7. Install Orbis globally**

```bash
npm install -g @orbis-ai/orbis
```

**8. Authenticate**

```bash
orbis login
```

**9. Start using it**

```bash
orbis ask "explain this error"
orbis agent "set up a Vitest config for this repo"
orbis plan "migrate this Express app to Fastify"
```

> Note: Backend and web client must both be running for local development of the auth flow.

---

## 🔗 Backend API Endpoints

Base URL: `http://localhost:3001/api`

---

### 🔐 Auth Routes — `/api/auth`

| Method | Endpoint | Description | Auth Required | Body |
|---|---|---|---|---|
| POST | `/api/auth/device/code` | Request a device code | No | - |
| POST | `/api/auth/device/token` | Poll for access token | No | `json: device_code` |
| GET | `/api/auth/whoami` | Get current authenticated user | Yes | - |
| POST | `/api/auth/logout` | Revoke stored token | Yes | - |

**Example Response — POST `/api/auth/device/code`**

```json
{
  "device_code": "abc123",
  "user_code": "WXYZ-1234",
  "verification_uri": "https://orbis-ai-rose.vercel.app/device",
  "expires_in": 900
}
```

---

### 🤖 AI Routes — `/api/ai`

| Method | Endpoint | Description | Auth Required | Body |
|---|---|---|---|---|
| POST | `/api/ai/ask` | Single-shot Q&A | Yes | `json: prompt` |
| POST | `/api/ai/agent` | Run an autonomous agent task | Yes | `json: goal` |
| POST | `/api/ai/plan` | Generate a step-by-step plan | Yes | `json: goal` |

**Example Response — POST `/api/ai/ask`**

```json
{
  "message": "Response generated successfully",
  "response": "This error occurs because..."
}
```

**Example Response — POST `/api/ai/plan`**

```json
{
  "message": "Plan generated successfully",
  "steps": [
    "Install Fastify and remove Express dependencies",
    "Convert route handlers to Fastify's plugin syntax",
    "Update server entry point and error handling"
  ]
}
```

---

## 🖥️ CLI Command Reference

| Command | Description |
|---|---|
| `orbis login` | Authenticate via OAuth device flow |
| `orbis logout` | Log out and clear stored credentials |
| `orbis whoami` | Display current authenticated user |
| `orbis wakeup` | Launch the interactive terminal UI with mode selection (Ask / Agent / Plan) |
| `orbis ask "<prompt>"` | Ask a one-off question |
| `orbis agent "<goal>"` | Run an autonomous agent task |
| `orbis plan "<goal>"` | Generate a step-by-step plan |
| `orbis --help` | Show help information |
| `orbis --version` | Show version number |

**CLI → Backend API Mapping**

| CLI Command | Backend Endpoint |
|---|---|
| Login | POST `/api/auth/device/code` → poll `/api/auth/device/token` |
| Whoami | GET `/api/auth/whoami` |
| Logout | POST `/api/auth/logout` |
| Wakeup | Launches local TUI — routes to Ask / Agent / Plan endpoints based on selection |
| Ask | POST `/api/ai/ask` |
| Agent | POST `/api/ai/agent` |
| Plan | POST `/api/ai/plan` |

---

## 👤 Author

Built with ❤️ by **Bishwajit Pattanaik**

- 🔗 GitHub: [github.com/bishwajitpattanaik](https://github.com/bishwajitpattanaik)
- 💼 LinkedIn: [linkedin.com/bishwajit-pattanaik-717818320](https://www.linkedin.com/in/bishwajit-pattanaik-717818320/)

---

## 🛠️ Support

For issues or questions, open an issue in the repository — [github.com/bishwajitpattanaik/orbis-ai/issues](https://github.com/bishwajitpattanaik/orbis-ai/issues)
