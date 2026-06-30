<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Google_AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google AI">
</p>

<h1 align="center">Luffy CLI</h1>

<p align="center">
  <strong>An AI-Powered Command-Line Interface Inspired by One Piece</strong>
</p>

<p align="center">
  Automate tasks and ship faster with an AI-powered CLI companion.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#ai-modes">AI Modes</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Features

### Secure Authentication
- OAuth 2.0 Device Flow for secure CLI authentication
- GitHub OAuth integration
- Persistent session management
- Secure token storage

### AI-Powered Modes

| Mode | Description |
|------|-------------|
| Chat Mode | Have natural conversations with your AI assistant |
| Tool Mode | Use tools like Google Search, code execution, and URL fetching |
| Agent Mode | Generate complete projects from plain-language descriptions |

### CLI Experience
- Pirate-themed interface inspired by One Piece
- Colorful, intuitive prompts
- Markdown rendering in terminal
- Conversation history tracking

---

## Project Structure

```
AI-Powered-CLI/
├── client/                           # Next.js frontend
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── sign-in/
│   │   │       └── page.tsx
│   │   ├── approve/
│   │   │   └── page.tsx
│   │   └── device/
│   │       └── page.tsx
│   ├── components/
│   │   ├── login-form.tsx
│   │   └── ui/                       # shadcn/ui components
│   ├── hooks/
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── auth-client.ts
│   │   └── utils.ts
│   └── public/
│
└── server/                           # Backend and CLI
    ├── src/
    │   ├── index.js                  # Express server entry
    │   ├── cli/
    │   │   ├── main.js               # CLI entry point
    │   │   ├── ai/
    │   │   │   └── google.service.js # Google AI service
    │   │   ├── chat/
    │   │   │   ├── chat-with-ai.js        # Chat mode
    │   │   │   ├── chat-with-ai-tool.js   # Tool mode
    │   │   │   └── chat-with-ai-agent.js  # Agent mode
    │   │   └── commands/
    │   │       ├── auth/
    │   │       │   ├── login.js
    │   │       │   ├── logout.js
    │   │       │   └── whoami.js
    │   │       └── ai/
    │   │           └── wakeUp.js
    │   ├── config/
    │   │   ├── agent.config.js       # Agent mode config
    │   │   ├── google.config.js      # Google AI config
    │   │   └── tool.config.js        # Tool definitions
    │   ├── lib/
    │   │   ├── auth.js               # Better Auth setup
    │   │   ├── db.js                 # Prisma client
    │   │   └── token.js              # Token management
    │   └── service/
    │       └── chat.service.js       # Chat business logic
    └── prisma/
        ├── schema.prisma             # Database schema
        └── migrations/               # Database migrations
```

---

## Installation

### Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** (or compatible database)
- **Google AI API Key** (for Gemini)
- **GitHub OAuth App** (for authentication)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Abhay-0103/AI-Powered-CLI.git
cd AI-Powered-CLI
```

### Step 2: Install Dependencies

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/luffy_cli"

# Authentication
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"

# Server
PORT=3001
CLIENT_URL="http://localhost:3000"
```

### Step 4: Set Up Database

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### Step 5: Install CLI Globally

```bash
cd server
npm link
```

### Step 6: Start Development Servers

```bash
# Terminal 1 - Start Client (Frontend)
cd client
npm run dev

# Terminal 2 - Start Server (Backend)
cd server
npm run dev
```

---

## Usage

### Authentication Commands

```bash
# Login to Luffy CLI (opens browser for OAuth)
luffy login

# Check current authenticated user
luffy whoami

# Logout and clear credentials
luffy logout
```

### Start the AI Interface

```bash
# Start the AI interface
luffy wakeup
```

This opens an interactive menu where you can choose a mode:

```
╔═══════════════════════════════════════╗
║                                       ║
║          Straw Hat Pirates            ║
║                                       ║
║            Ahoy, Captain              ║
║                                       ║
║   Choose your adventure below...      ║
║                                       ║
╚═══════════════════════════════════════╝

Choose your path:
- Chat Mode
- Tool Mode
- Agent Mode
```

---

## AI Modes

### Chat Mode

Have natural conversations with your AI assistant.

```bash
luffy wakeup
# Select: Chat Mode
```

**Features:**
- Natural language conversations
- Markdown-formatted responses
- Conversation history saved to database
- Context-aware responses

---

### Tool Mode

Chat with access to powerful tools.

```bash
luffy wakeup
# Select: Tool Mode
```

**Available Tools:**

| Tool | Description |
|------|-------------|
| **Google Search** | Search the web for real-time information |
| **Code Execution** | Run JavaScript/Python code snippets |
| **URL Context** | Fetch and analyze content from URLs |

**Example:**
```
You: Search for the latest Next.js features
AI: [Uses Google Search tool]
    Here are the latest Next.js 15 features...
```

---

### Agent Mode

Generate complete applications from natural language descriptions.

```bash
luffy wakeup
# Select: Agent Mode
```

**Capabilities:**
- Generate complete applications from descriptions
- Create all necessary files and folders
- Include setup instructions and commands
- Generate production-ready code

**Example Prompts:**
```
"Build a todo app with React and Tailwind"
"Create a REST API with Express and MongoDB"
"Make a weather app using OpenWeatherMap API"
"Build a portfolio website with Next.js"
```

**Output:**
```
Building your application...

Project created: todo-app-react

Project structure:
todo-app-react/
├── index.html
├── styles.css
├── app.js
└── README.md

Application created successfully.

Location: C:\Users\...\todo-app-react

Next steps:
  cd todo-app-react
  open index.html
```

---

## Authentication Flow

The CLI uses OAuth 2.0 Device Authorization Grant:

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│     CLI     │          │   Server    │          │   Browser   │
└──────┬──────┘          └──────┬──────┘          └──────┬──────┘
       │                        │                        │
       │  1. Request Code       │                        │
       │───────────────────────>│                        │
       │                        │                        │
       │  2. Return Code + URL  │                        │
       │<───────────────────────│                        │
       │                        │                        │
       │  3. Open Browser ──────────────────────────────>│
       │                        │                        │
       │                        │   4. User Enters Code  │
       │                        │<───────────────────────│
       │                        │                        │
       │                        │   5. User Approves     │
       │                        │<───────────────────────│
       │                        │                        │
       │  6. Poll for Token     │                        │
       │───────────────────────>│                        │
       │                        │                        │
       │  7. Return Token       │                        │
       │<───────────────────────│                        │
       │                        │                        │
       │  8. Store Locally      │                        │
       └────────────────────────┘                        │
```

---

## Tech Stack

### Client (Frontend)

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Beautiful UI components |
| **Better Auth** | Authentication client |

### Server (Backend & CLI)

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web server framework |
| **Better Auth** | Authentication server |
| **Prisma** | Database ORM |
| **Google Gemini AI** | AI language model |
| **Commander.js** | CLI framework |
| **@clack/prompts** | Beautiful CLI prompts |
| **Chalk** | Terminal styling |
| **Boxen** | Terminal boxes |
| **Figlet** | ASCII art text |
| **Marked** | Markdown parsing |

---

## CLI Commands Reference

| Command | Description |
|---------|-------------|
| `luffy login` | Authenticate using OAuth Device Flow |
| `luffy logout` | Log out and clear stored credentials |
| `luffy whoami` | Display current authenticated user |
| `luffy wakeup` | Start AI interface with mode selection |
| `luffy --help` | Show help information |
| `luffy --version` | Show version number |

---

## Configuration

### Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add to your `.env` file:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"
   ```

### GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to `http://localhost:3000/api/auth/callback/github`
4. Add credentials to your `.env` file

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/AI-Powered-CLI.git

# Install dependencies
cd AI-Powered-CLI/server
npm install

# Start development
npm run dev
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Inspired by **One Piece** and the spirit of adventure
- Built with [Google Gemini AI](https://ai.google.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication by [Better Auth](https://www.better-auth.com/)

---

<p align="center">
  <strong>"I'm gonna be the King of the Code!" - Luffy CLI</strong>
</p>

<p align="center">
  Made by <a href="https://github.com/Abhay-0103">Abhay Singh</a>
</p>

<p align="center">
  <a href="https://github.com/Abhay-0103/AI-Powered-CLI/issues">Report Bug</a> •
  <a href="https://github.com/Abhay-0103/AI-Powered-CLI/issues">Request Feature</a>
</p>
