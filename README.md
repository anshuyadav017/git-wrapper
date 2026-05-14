# GitHub Wrapped 🎁

A powerful REST API that takes any GitHub username and generates a comprehensive, shareable year-in-review with AI-generated roast/praise and beautiful PNG cards.

![GitHub Wrapped](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ Features

- **GitHub Data Analysis** - Fetches and analyzes commits, PRs, repositories, and activity patterns
- **AI-Powered Roasts** - Generates funny, personalized roasts using Gemini AI
- **Beautiful Cards** - Dynamically generates shareable PNG cards with stats visualization
- **User Comparison** - Compare any two GitHub users side-by-side
- **Activity Insights** - Tracks streaks, most active days/times, top languages
- **Personality Badges** - Assigns fun badges based on coding patterns
- **Caching** - In-memory caching for fast response times

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Wrapped                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Landing    │    │    Result    │    │   Compare    │      │
│  │    Page      │───▶│    Page      │    │    Page      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         └───────────────────┴───────────────────┘               │
│                             │                                   │
│                      ┌──────▼──────┐                           │
│                      │   Express    │                           │
│                      │    Server    │                           │
│                      └──────┬──────┘                           │
│                             │                                   │
│    ┌────────────────────────┼────────────────────────┐        │
│    │                        │                        │        │
│ ┌──▼──────────┐    ┌────────▼───────┐    ┌───────────▼───┐    │
│ │   Wrapped   │    │     Card       │    │    Compare    │    │
│ │    API      │    │      API       │    │      API      │    │
│ └──────┬──────┘    └───────┬───────┘    └───────┬───────┘    │
│        │                    │                    │             │
│        └────────────────────┴────────────────────┘             │
│                             │                                   │
│        ┌────────────────────┼────────────────────┐            │
│        │                    │                    │            │
│  ┌─────▼─────┐    ┌─────────▼──────┐    ┌───────▼──────┐     │
│  │  Stats    │    │  Image Service │    │    AI        │     │
│  │  Service  │    │   (Jimp)       │    │   Service    │     │
│  └─────┬─────┘    └────────────────┘    │  (Gemini)     │     │
│        │                                 └───────────────┘     │
│  ┌─────▼───────────────────────────────────────────────┐      │
│  │              GitHub API Service                      │      │
│  │         (with caching & rate limit handling)         │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Node.js, Express.js
- **Image Generation**: Jimp (Node.js image processing)
- **AI Integration**: Google Gemini API
- **HTTP Client**: Axios
- **Frontend**: Vanilla HTML/CSS/JS with modern design
- **Deployment**: Docker, Docker Compose

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/wrapped/:username` | GET | Get complete wrapped data with stats, roast, and praise |
| `/card/:username` | GET | Generate PNG card image |
| `/compare/:user1/:user2` | GET | Generate comparison card for two users |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd github-wrapped
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   PORT=3000
   GITHUB_TOKEN=your_github_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=development
   CACHE_TTL=300
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open http://localhost:3000 in your browser
   - Enter any GitHub username to generate their wrapped

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📖 Usage Examples

### Get Wrapped Data

```bash
curl http://localhost:3000/wrapped/torvalds
```

Response:
```json
{
  "success": true,
  "data": {
    "username": "torvalds",
    "avatarUrl": "https://avatars.githubusercontent.com/u/1024105?v=4",
    "bio": "Linux and Git",
    "followersCount": 180000,
    "followingCount": 0,
    "totalCommits": 1234,
    "totalPRs": 56,
    "totalStars": 0,
    "topLanguages": [
      { "name": "C", "count": 45, "percentage": 85 }
    ],
    "longestStreak": 30,
    "currentStreak": 5,
    "mostActiveDay": "Monday",
    "mostActiveHour": "9 AM",
    "timeOfDay": "early bird",
    "personalityBadge": "🌅 The Early Bird",
    "roast": "...",
    "praise": "..."
  }
}
```

### Generate Card Image

```bash
# Save the image
curl -o card.png http://localhost:3000/card/torvalds
```

### Compare Two Users

```bash
curl -o compare.png http://localhost:3000/compare/torvalds/gaearon
```

## 🎨 Frontend Features

### Landing Page (`index.html`)
- Animated particle background
- Search with example username pills
- How it works section
- Responsive design

### Result Page (`result.html`)
- Profile card with avatar and bio
- Stats grid with animated numbers
- Language distribution bar chart
- Activity patterns (day/time)
- Flip card for roast/praise toggle
- Download card functionality
- Social sharing (Twitter, LinkedIn)

### Compare Page (`compare.html`)
- Two-user input form
- Side-by-side stats comparison
- Winner announcement
- Download comparison card

## 🛠️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `GITHUB_TOKEN` | - | GitHub API token (optional, for higher rate limits) |
| `GEMINI_API_KEY` | - | Gemini API key for AI roasts (optional, falls back to random roasts) |
| `CACHE_TTL` | 300 | Cache time-to-live in seconds |

## 📁 Project Structure

```
github-wrapped/
├── src/
│   ├── api/
│   │   ├── wrapped.js       # Wrapped data endpoint
│   │   ├── card.js         # Card image generation
│   │   └── compare.js      # Comparison endpoint
│   ├── services/
│   │   ├── githubService.js    # GitHub API integration
│   │   ├── statsService.js     # Stats calculation
│   │   ├── aiService.js        # AI roast/praise generation
│   │   └── imageService.js     # PNG card generation
│   ├── utils/
│   │   ├── cache.js        # In-memory cache
│   │   └── errors.js       # Error handling
│   ├── app.js              # Express app setup
│   └── server.js           # Server entry point
├── public/
│   ├── css/
│   │   ├── main.css        # Global styles
│   │   ├── landing.css     # Landing page styles
│   │   ├── result.css      # Result page styles
│   │   └── compare.css     # Compare page styles
│   ├── js/
│   │   ├── landing.js      # Landing page logic
│   │   ├── result.js       # Result page logic
│   │   └── compare.js      # Compare page logic
│   ├── index.html          # Landing page
│   ├── result.html         # Result page
│   └── compare.html       # Compare page
├── tests/
│   ├── stats.test.js
│   ├── wrapped.test.js
│   └── image.test.js
├── .env.example
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔧 Development

### Running Tests

```bash
npm test              # Run tests
npm run test:coverage # Run with coverage
```

### Linting

```bash
npm run lint
```

## 🤖 AI Integration

The application uses Google Gemini AI to generate:
- **Roasts**: Funny, slightly mean but not cruel observations about the user's coding habits
- **Praise**: Genuine, motivating messages highlighting strengths

If no Gemini API key is provided, the app falls back to pre-written random roasts/praises.

### Example Prompt

```
You are roasting a developer based on their GitHub stats. Be funny, a bit mean, but not cruel.

Developer Stats:
- Total commits: 1234
- Longest streak: 45 days
- Top language: JavaScript

Write a brutal but hilarious roast.
```

## 🐳 Docker

The project includes Docker support for easy deployment:

```dockerfile
# Build
docker build -t github-wrapped .

# Run
docker run -p 3000:3000 -e GITHUB_TOKEN=xxx -e GEMINI_API_KEY=xxx github-wrapped
```

Or use Docker Compose as shown in Quick Start.

## 📝 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- GitHub API for providing access to user data
- Google Gemini for AI-powered roasts
- Jimp for image generation
- Express.js for the web framework

## 🔗 Links

- [GitHub API](https://docs.github.com/en/rest)
- [Gemini API](https://ai.google.dev/docs)
- [Jimp](https://jimp.org/)

---

**Made with ❤️ for developers everywhere**