# Komi Telegram Clicker Bot

This repository contains a production-ready implementation of the Telegram Clicker Game technical test. It includes a Fastify + Telegraf backend, a React-based Telegram Mini App frontend, Prisma with PostgreSQL for persistence, Redis for caching and rate-limiting, and Dockerized infrastructure for local and production deployments.

## Architecture Overview

- **Backend** (`backend/`)
  - Fastify REST API with rate limiting, security headers, and CORS.
  - Telegraf bot handling onboarding flows, scenes, and click interactions.
  - Prisma ORM with PostgreSQL storing users, sessions, click events, leaderboard snapshots, and system metrics.
  - Redis powering rate limiting, real-time leaderboard rankings, and cached metrics.
  - BullMQ job scheduler for periodic session cleanup and background maintenance.
- **Frontend** (`frontend/`)
  - Vite + React + React Query Mini App delivering responsive clicker UI.
  - Heartbeat watchdog keeping sessions active and surfacing connectivity status.
  - Leaderboard view with live updates and total-click statistics.
- **Infrastructure** (`infra/`)
  - Docker Compose orchestrating backend, frontend, PostgreSQL, and Redis services.
  - Production Docker images for both backend (Node 22) and frontend (Nginx).

## Getting Started

### Prerequisites

- Node.js 22+
- Docker and Docker Compose
- Telegram Bot token and secret for webhook validation

### Environment Variables

Create `backend/.env` (or use `.env.docker` for compose) with:

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://komi:komi@postgres:5432/komi?schema=public
REDIS_URL=redis://redis:6379/0
TELEGRAM_BOT_TOKEN=<your_token>
TELEGRAM_BOT_SECRET=<shared_secret>
RATE_LIMIT_MAX=30
RATE_LIMIT_WINDOW=60000
```

### Local Development

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run Prisma migrations
docker compose -f infra/docker-compose.yml up -d postgres redis
cd backend && npx prisma migrate deploy

# Start backend and frontend in dev mode
npm run dev --prefix backend
npm run dev --prefix frontend
```

### Dockerized Runtime

```bash
cd infra
docker compose up --build
```

The backend is available at `http://localhost:3000`, and the Mini App is served at `http://localhost:5173` (or Nginx on port 80 when using the production Dockerfile).

### Testing

```bash
cd backend
npm test
```

## Features

- Graceful onboarding requiring username setup via Telegram scenes.
- Real-time click tracking with Redis-backed rate limiting (25 clicks/sec per user).
- Leaderboard of top 20 players with self highlighting and cached refreshes.
- Global click counters with low-latency redis cache.
- Session heartbeat and cleanup to reclaim inactive sessions while offering reconnection.
- Automatic background job scheduling via BullMQ.
- Production-grade logging, error handling, validation, and API schema enforcement.

## Deployment Notes

- Configure `TELEGRAM_BOT_WEBHOOK` for webhook mode; otherwise the bot runs in long-polling.
- Set up HTTPS termination (e.g., reverse proxy or load balancer) when deploying publicly.
- Provision managed PostgreSQL and Redis instances for HA workloads.
- Regularly prune `click_event` records or materialize analytics if long-term history is required.

## Task Specification (from TODO.md)

```
Telegram’s Technical Test - Rev. 002
Introduction
The goal of this test is to assess your technical skills in working with Telegram UI elements, organizing scenarios, and managing multiple sessions in a scalable way.
Exercise
This exercise pays homage to a niche sub-genre of gaming: the Clicker Games.
Each tap on a button increments a user’s all-time click count.
The top 20 users with the most clicks appear on a public leaderboard for lasting glory.
Specs
A /start flow that asks new users to set a username, if it wasn’t already set before ;
Redirect the user to the main flow with a Welcome Message showing:
The current user’s total number of clicks ;
The total number of clicks across everyone using the Telegram bot ;
The leaderboard with the top 20 clickers ;
In a Telegram Mini App, the user accesses the game and can press the button to increase their score ;
About the test
Your solution should support a scale of 100,000+ total users and approximately 5,000 active users:
You must degrade the user experience gracefully as concurrency grows to avoid hitting the rate-limits ;
Reliably detect when users become inactive so sessions can be cleaned up, while providing a UI fallback to reactivate a session ;
Store per-user clicks and global totals in an appropriate data store optimized for fast reads and scalability.
The infrastructure must be containerized using Docker and docker-compose.
You may use any technologies you see fit.
The best UX wins. User should not be soft-locked and the adequate TG widgets should be used.
You may over-deliver with thoughtful improvements you see fit.
Keep the solution simple without sacrificing elegance. (Avoid hacky or unscalable approaches)
Evaluation criteria
50% — Backend architecture (scenario manager, etc.)
30% — Knowledge of Telegram’s API and use of appropriate UI widgets
20% — UX friendliness
```
