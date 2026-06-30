# ⚓ Orbis CLI - Project Requirements & Setup

## System Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 18.0+ | Required for both client and server |
| **npm** | 9.0+ | Comes with Node.js |
| **PostgreSQL** | 14.0+ | Database for Prisma ORM |
| **Git** | 2.0+ | Version control |

## Environment Variables

### Server (`server/.env`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/luffy_cli"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3001"

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"

# GitHub OAuth (optional)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### Client (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd 24_CLI
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### 4. Install Client Dependencies

```bash
cd ../client
npm install
```

### 5. Install CLI Globally (Optional)

```bash
cd ../server
npm link
```

---

## Running the Project

### Development Mode

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

### Using the CLI

```bash
# After npm link
Orbis --help

# Or run directly
cd server
node src/cli/main.js --help
```

---

## Dependencies Overview

### Server Dependencies

| Package | Purpose |
|---------|---------|
| `@ai-sdk/google` | Google Gemini AI integration |
| `ai` | Vercel AI SDK |
| `better-auth` | Authentication library |
| `@prisma/client` | Database ORM |
| `express` | HTTP server |
| `commander` | CLI framework |
| `@clack/prompts` | Interactive CLI prompts |
| `chalk` | Terminal styling |
| `boxen` | Terminal boxes |
| `figlet` | ASCII art text |
| `marked` / `marked-terminal` | Markdown rendering |

### Client Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework |
| `react` | UI library |
| `better-auth` | Auth client |
| `@radix-ui/*` | UI components |
| `tailwindcss` | CSS framework |
| `lucide-react` | Icons |

---

## Ports

| Service | Port |
|---------|------|
| Server (Express) | 3001 |
| Client (Next.js) | 3000 |
| PostgreSQL | 5432 |

---

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
npx prisma migrate reset
```

### CLI Not Found After npm link
```bash
# Unlink and relink
npm unlink -g
npm link
```

### Prisma Client Issues
```bash
npx prisma generate
```
