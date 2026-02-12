# Productivity Tracker

A minimal, clean productivity analysis tool that uses AI to evaluate your daily work and track progress over time.

## Features

- **AI-Powered Analysis**: Gemini Flash analyzes your daily activities and assigns a productivity score (1-10)
- **Minimal UI**: Single-page, no-scroll design with clean typography and generous whitespace
- **Historical Tracking**: View past productivity scores and feedback with visual graph
- **Neon Database**: Persistent storage of all productivity entries
- **Real-time Comparison**: See how today's productivity compares to previous days

## Quick Start

1. **Add Environment Variables**
   - In the Vercel dashboard, add `GEMINI_API_KEY` (get from [Google AI Studio](https://aistudio.google.com/app/apikey))
   - Neon database URL is automatically configured via the integration

2. **Initialize Database**
   - The database schema is automatically created on first request
   - Run `pnpm dev` to start the dev server
   - Visit http://localhost:3000

3. **Install Dependencies**
   ```bash
   pnpm install
   pnpm dev
   ```

## Deployment

### On Vercel (Recommended)
1. Push your repo to GitHub
2. Connect to Vercel: vercel.com/new
3. Add the Neon integration in Vercel dashboard
4. Add `GEMINI_API_KEY` in Environment Variables
5. Deploy

### Database Setup
On first request to `/api/analyze`, the `productivity_entries` table is automatically created. No manual setup needed.

## How to Use

1. Describe what you did today in the input field
2. Click "Analyze" to get AI feedback and your productivity score
3. View your score and feedback immediately
4. Check the graph at the bottom to see trends over the past 14 days
5. Each day has one entry—updating on the same day overwrites the previous entry

## Tech Stack

- **Next.js 16** - App Router, Server & Client Components
- **Gemini 1.5 Flash** - AI-powered productivity analysis
- **Neon PostgreSQL** - Serverless database
- **Tailwind CSS** - Utility-first styling
- **Geist Mono** - Minimal monospace typography
- **Recharts** - Interactive productivity graphs
- **TypeScript** - Type safety

## System Prompt

The AI uses this system prompt for analysis:

> You are a productivity analysis expert. Analyze the user's activity description and provide:
> 1. A productivity score from 1-10 based on the work done
> 2. A brief 2-3 line feedback on their productivity
> 
> Consider factors like: time spent on valuable tasks, progress made on goals, work quality and focus, balance and breaks.

## Design Principles

- **Minimal**: Only essential UI elements, no clutter
- **Symmetrical**: Centered layout, balanced spacing
- **Geist Design**: Clean, modern aesthetic
- **Monospace Typography**: Professional, technical feel
- **No Scroll**: Everything fits on one screen
- **Breathing Space**: Generous padding (8-16px gaps between elements)
- **Dark Mode**: Easy on eyes (neutral-950 background)
- **Vercel Design System**: Follows Vercel's design patterns

## Data Storage

Each productivity entry is stored with:
- `user_date`: Unique date (one entry per day)
- `prompt`: What the user described
- `score`: 1-10 productivity score
- `feedback`: AI-generated feedback
- `created_at` / `updated_at`: Timestamps

Same-day submissions update the existing entry.
