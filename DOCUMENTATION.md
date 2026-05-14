# GitHub Wrapped — Complete Project Documentation

> A cinematic, AI-powered retrospective of any GitHub developer's year in code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [How the Application Works](#2-how-the-application-works)
3. [Architecture & Code Walkthrough](#3-architecture--code-walkthrough)
4. [API Endpoints](#4-api-endpoints)
5. [Frontend Pages](#5-frontend-pages)
6. [Environment Variables](#6-environment-variables)
7. [Docker — What It Is & How It's Used](#7-docker--what-it-is--how-its-used)
8. [CI/CD Pipeline — GitHub Actions](#8-cicd-pipeline--github-actions)
9. [The Full Pipeline: Code to Production](#9-the-full-pipeline-code-to-production)
10. [How to Run Locally](#10-how-to-run-locally)

---

## 1. Project Overview

**GitHub Wrapped** is a full-stack web application that takes any GitHub username and generates:

- 📊 **Comprehensive stats** — commits, PRs, stars, streaks, top languages
- 🔥 **AI-generated roast** — a brutally funny take on their coding habits
- ✨ **AI-generated praise** — genuine motivational recognition
- 🎨 **Downloadable PNG card** — a shareable visual summary
- ⚔️ **User comparison** — pit two developers against each other

**Tech Stack:** Node.js, Express, Jimp (image generation), OpenRouter AI, Vanilla HTML/CSS/JS

---

## 2. How the Application Works

The application follows a simple 3-step pipeline when a user searches for a GitHub username:

```
User enters username
        │
        ▼
┌──────────────────┐
│  1. FETCH DATA   │  → GitHub REST API + GraphQL API
│                  │  → Repos, commits, PRs, contribution calendar
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  2. COMPUTE      │  → Calculate streaks, language percentages
│     STATS        │  → Assign personality badge
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  3. AI GENERATE  │  → Send stats to OpenRouter (Gemini Flash)
│                  │  → Get back roast + praise text
└────────┬─────────┘
         │
         ▼
   JSON response sent to frontend
   Frontend animates everything cinematically
```

---

## 3. Architecture & Code Walkthrough

### Project Structure

```
github-wrapped/
├── src/
│   ├── server.js              # Entry point — starts Express on PORT
│   ├── app.js                 # Express app setup, routes, static files
│   ├── api/
│   │   ├── wrapped.js         # GET /wrapped/:username — main stats endpoint
│   │   ├── card.js            # GET /card/:username — PNG card generation
│   │   └── compare.js         # GET /compare/:user1/:user2 — comparison card
│   ├── services/
│   │   ├── githubService.js   # Talks to GitHub API (REST + GraphQL)
│   │   ├── statsService.js    # Crunches raw data into meaningful stats
│   │   ├── aiService.js       # Calls OpenRouter AI for roasts/praise
│   │   └── imageService.js    # Uses Jimp to generate PNG cards
│   └── utils/
│       ├── cache.js           # In-memory cache (TTL-based)
│       └── errors.js          # Custom error classes
├── public/
│   ├── index.html             # Landing page (search)
│   ├── result.html            # Stats dashboard (animated)
│   └── compare.html           # Battle comparison page
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI pipeline (test on PR)
│       └── publish.yml        # CD pipeline (build & push Docker image)
├── Dockerfile                 # Container build instructions
├── docker-compose.yml         # One-command container orchestration
├── .env                       # Local secrets (never committed)
├── .env.example               # Template for .env
└── package.json               # Dependencies & scripts
```

### How Each Service Works

#### `githubService.js` — Data Fetching
- Uses **GitHub REST API** to fetch user profile, repos, followers
- Uses **GitHub GraphQL API** to fetch the full contribution calendar (commits, PRs, issues per day for the last year)
- Implements **retry logic** (3 attempts) and **in-memory caching** to avoid hitting rate limits
- Requires a `TOKEN` (GitHub Personal Access Token) for GraphQL queries

#### `statsService.js` — Stats Computation
- Takes raw GitHub data and computes:
  - **Longest streak** and **current streak** (consecutive days with commits)
  - **Top languages** with percentage distribution
  - **Most active day of week** and **time of day**
  - **Personality badge** (e.g., "🌅 The Early Bird", "🦉 The Night Owl", "🔥 Streak Machine")

#### `aiService.js` — AI Content Generation
- Sends developer stats to **OpenRouter API** using the `google/gemini-2.5-flash` model
- Generates two outputs:
  - **Roast** — funny, brutal, witty (temperature: 1.2 for creativity)
  - **Praise** — motivational, genuine (temperature: 0.7 for consistency)
- Falls back to pre-written random roasts/praises if the AI API is unavailable

#### `imageService.js` — PNG Card Generation
- Uses **Jimp** (pure JavaScript image library) to dynamically create PNG cards
- Draws gradient backgrounds, avatar circles, stat text, and language bars
- Output is a downloadable PNG image served directly from the API

---

## 4. API Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/health` | GET | Health check | `{ status: "ok" }` |
| `/wrapped/:username` | GET | Full stats + AI content | JSON with all stats, roast, praise |
| `/card/:username` | GET | Downloadable PNG card | `image/png` binary |
| `/compare/:user1/:user2` | GET | Side-by-side comparison card | `image/png` binary |

### Example Response (`/wrapped/torvalds`)

```json
{
  "success": true,
  "data": {
    "username": "torvalds",
    "avatarUrl": "https://avatars.githubusercontent.com/...",
    "bio": "Linux and Git",
    "totalCommits": 1234,
    "totalPRs": 56,
    "totalStars": 180000,
    "publicRepos": 8,
    "topLanguages": [{ "name": "C", "percentage": 85 }],
    "longestStreak": 45,
    "currentStreak": 12,
    "personalityBadge": "🔥 Streak Machine",
    "roast": "1234 commits and still no dark mode? ...",
    "praise": "Your consistency is legendary ..."
  }
}
```

---

## 5. Frontend Pages

All three pages use **zero external dependencies** — CSS and JS are embedded directly in the HTML for maximum portability.

### `index.html` — Landing Page
- Interactive **particle system** (canvas) with mouse-reactive connections
- **Typewriter animation** for the hero title
- Glassmorphism search bar with glow effect on focus
- Quick-access pills for famous developers
- Scroll-triggered feature card reveals

### `result.html` — Stats Dashboard
- **Loading screen** with animated ring while API fetches data
- Staggered cascade animations (each section appears sequentially)
- Animated number counters that roll up to final values
- Language distribution bars that grow with eased transitions
- Contribution heatmap with randomized green intensity cells
- **3D flip card** — tap to toggle between Roast and Praise
- Download PNG card button

### `compare.html` — Battle Page
- Dual input form with VS divider
- Fighters slide in from left/right with staggered timing
- Metric rows appear one-by-one with winner highlighting (green glow)
- Score counter animation
- Fixed winner banner slides up from bottom

---

## 6. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TOKEN` | ✅ Yes | GitHub Personal Access Token for API access |
| `OPENROUTER_API_KEY` | ✅ Yes | OpenRouter API key for AI roasts/praise |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `CACHE_TTL` | No | Cache duration in seconds (default: 300) |

### GitHub Repository Secrets (for CI/CD)

These are set in **GitHub → Settings → Secrets and variables → Actions**:

| Secret Name | Purpose |
|-------------|---------|
| `TOKEN` | GitHub API access during builds |
| `OPENROUTER_API_KEY` | AI API access |
| `DOCKER_USERNAME` | Docker Hub login username |
| `DOCKER_TOKEN` | Docker Hub access token |

---

## 7. Docker — What It Is & How It's Used

### What is Docker?

Docker is a tool that **packages your entire application** — code, dependencies, runtime, and configuration — into a single, portable unit called a **container**. This container runs identically on any machine: your laptop, a cloud server, or your friend's computer.

**Think of it like this:** Instead of saying "install Node.js 18, then npm install, then set these env vars, then run this command", you just say "run this container" and everything works.

### How Docker is Used in This Project

#### `Dockerfile` — The Build Recipe

```dockerfile
# Stage 1: Install dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                        # Install exact dependency versions
COPY src/ ./src/
COPY public/ ./public/

# Stage 2: Create lean production image
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]     # Start the app
```

**Why multi-stage?** Stage 1 installs everything (including build tools). Stage 2 copies only what's needed to run. This makes the final image much smaller and more secure.

#### `docker-compose.yml` — One-Command Deployment

```yaml
services:
  github-wrapped:
    build: .
    ports: ["3000:3000"]
    env_file: .env                # Loads your secrets automatically
    restart: unless-stopped       # Auto-restart on crash
    healthcheck:                  # Monitors if the app is alive
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
```

**Usage:**
```bash
docker-compose up -d     # Build & start in background
docker-compose logs -f   # Watch live logs
docker-compose down      # Stop everything
```

---

## 8. CI/CD Pipeline — GitHub Actions

### What is CI/CD?

- **CI (Continuous Integration):** Automatically test your code every time you make changes, catching bugs before they reach production.
- **CD (Continuous Deployment):** Automatically build and deploy your application when tests pass.

### Pipeline 1: `ci.yml` — Testing (CI)

**Triggers:** When a Pull Request is opened targeting the `master` branch.

```
Developer opens a Pull Request
        │
        ▼
┌──────────────────────┐
│  1. Checkout Code    │  → Downloads your repository
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  2. Setup Node.js    │  → Installs Node.js 18 with npm cache
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  3. npm ci           │  → Installs exact dependencies
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  4. ESLint           │  → Checks code quality & style
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  5. Jest Tests       │  → Runs unit tests with coverage
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  6. Upload Coverage  │  → Sends report to Codecov
└──────────────────────┘
```

**Purpose:** If any step fails, the PR is marked with a ❌ and you know the code is broken before merging.

### Pipeline 2: `publish.yml` — Docker Build & Push (CD)

**Triggers:** When code is pushed to `master` OR a version tag (`v1.0.0`) is created.

```
Code merged to master (or tag created)
        │
        ▼
┌──────────────────────┐
│  1. Checkout Code    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  2. Setup Buildx     │  → Advanced Docker builder with caching
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  3. Docker Login     │  → Authenticates with Docker Hub
│                      │     using DOCKER_USERNAME + DOCKER_TOKEN
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  4. Build Image      │  → Runs your Dockerfile
│                      │  → Tags as "latest" + commit SHA
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  5. Push to Hub      │  → Uploads to Docker Hub registry
│                      │  → Anyone can now pull & run it
└──────────────────────┘
```

**Purpose:** Every time you merge code, a fresh Docker image is automatically built and published. Anyone in the world can then run your app with one command:

```bash
docker pull yourusername/github-wrapped:latest
docker run -p 3000:3000 -e TOKEN=xxx -e OPENROUTER_API_KEY=xxx yourusername/github-wrapped
```

---

## 9. The Full Pipeline: Code to Production

Here is the complete journey of a code change from your editor to a live deployment:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER WORKFLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Write code locally                                          │
│     └─► Test with `npm start` at localhost:3000                 │
│                                                                 │
│  2. Create a Pull Request                                       │
│     └─► GitHub Actions (ci.yml) runs automatically              │
│         ├── ESLint checks code style                            │
│         ├── Jest runs all tests                                 │
│         └── ❌ Fail? Fix code. ✅ Pass? Ready to merge.         │
│                                                                 │
│  3. Merge PR to master                                          │
│     └─► GitHub Actions (publish.yml) runs automatically         │
│         ├── Builds Docker image from Dockerfile                 │
│         ├── Tags it (latest + SHA)                              │
│         └── Pushes to Docker Hub                                │
│                                                                 │
│  4. Deploy anywhere                                             │
│     └─► Any server runs: docker pull + docker run               │
│         └── App is live on port 3000                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. How to Run Locally

### Option A: Node.js (Development)

```bash
git clone https://github.com/anshuyadav017/git-wrapper.git
cd git-wrapper
npm install
cp .env.example .env           # Then fill in your TOKEN and OPENROUTER_API_KEY
npm start                      # Server runs at http://localhost:3000
```

### Option B: Docker (Production-like)

```bash
git clone https://github.com/anshuyadav017/git-wrapper.git
cd git-wrapper
cp .env.example .env           # Fill in secrets
docker-compose up -d           # Builds and starts in background
# Visit http://localhost:3000
```

---

**Made with ❤️ by [anshuyadav017](https://github.com/anshuyadav017)**
