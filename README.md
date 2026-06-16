# Superhuman Clone

A high-performance, keyboard-centric email and calendar client inspired by Superhuman. Built with Next.js App Router, Tailwind CSS, Prisma, and Corsair for deep Google Workspace integration.

## 🚀 Overview

This project is a sophisticated email client that aims to replicate the speed, aesthetic, and keyboard-driven workflow of Superhuman. It integrates deeply with Google Workspace (Gmail and Google Calendar) using Corsair for secure, reliable API access, and incorporates advanced AI capabilities using the Vercel AI SDK.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (with custom scrollbars and fluid animations)
- **Database**: PostgreSQL (via Neon) with [Prisma ORM](https://www.prisma.io/)
- **Vector Search**: pgvector extension for PostgreSQL
- **Integrations**: [Corsair](https://corsair.dev/) (Gmail API, Google Calendar API)
- **AI/LLM**: Vercel AI SDK (`@ai-sdk/mistral`, `@ai-sdk/openai`, `@ai-sdk/mcp`)
- **Data Fetching**: SWR for optimistic UI updates and real-time caching
- **UI Components**: Shadcn UI, Lucide React, Base UI

## 🏗 Architecture & Core Infrastructure

- **Next.js App Router**: Powers the entire application with Server Components where possible, and Client Components for highly interactive UI elements (like the keyboard listener and command palette).
- **Prisma & PostgreSQL**: Uses a sophisticated schema including `pgvector` for potential AI-driven semantic search over emails. The database also tracks user roles, team structures, digest caching, and follow-ups.
- **Corsair Integration**: Corsair acts as the bridge to Google Workspace. It handles OAuth tokens, webhook delivery (e.g., new email notifications), and rate limiting. The database maintains specialized tables (`corsair_integrations`, `corsair_accounts`, `corsair_entities`, `corsair_events`) to seamlessly sync state.
- **Vercel AI SDK + MCP**: The project includes a highly capable Agent that can answer queries, summarize emails, and take actions on your behalf (like fetching calendar events) using the Model Context Protocol (MCP).

## 📊 Database Schema Highlights

The project utilizes Prisma with several key models:
- `User` & `Team`: Manages user accounts, authentication (Google/Local), and team structures (Free, Pro, Team Admin).
- `Email`: Stores synced email metadata, including body text, sender info, priority levels, and a `vector(1536)` embedding field for semantic search.
- `DigestCache`: Stores AI-generated daily summaries of a user's inbox to prevent redundant LLM API calls, backed up by Redis.
- `FollowUp`: Tracks scheduled follow-ups and actions linked to specific emails.
- `Corsair*`: Specialized models that mirror Corsair's internal state to ensure robust webhook processing and entity management.

## 🚀 Current State of the Project

This project is actively in development. Below is a breakdown of what is fully functional (wired to the backend/APIs) and what is currently mocked UI.

### ✅ Fully Functional (Wired to Backend)

- **Authentication**: Fully working Google OAuth flow and JWT-based session management.
- **Inbox Syncing**: 
  - Real-time email fetching from your actual Gmail account.
  - Emails are correctly sorted by date (newest first).
  - Search functionality successfully queries your live inbox.
- **Email Actions**: 
  - **Read**: View sanitized HTML bodies of your actual emails in the reading pane using DOMPurify.
  - **Archive**: Removes the `INBOX` label from the email in Gmail.
  - **Delete (Trash)**: Moves the email to the Trash folder in Gmail.
  - **Reply / Forward / Compose**: The compose modal is functional and successfully sends emails via the Gmail API.
- **Calendar Integration**: 
  - Fetches events across all your active (non-holiday) Google Calendars.
  - Fully working Day, Week, and Month views that correctly map your real events to a visual timeline.
- **AI Agent (Chat UI)**:
  - Accessible via the sidebar or command palette.
  - Can fetch real-time calendar data using MCP tools (`get_calendar_events`) and synthesize natural language summaries.
  - Includes a voice input integration (`useVoiceInput` hook) for dictating commands to the agent.
- **Sidebar**: Dynamic user profile display (pulls your name/initials) and working Logout functionality.
- **Keyboard Shortcuts**: Global shortcuts are wired up:
  - `c`: Compose new email
  - `e`: Archive selected email
  - `r`: Reply to selected email
  - `/`: Focus search bar
  - `?`: Toggle shortcut overlay

### 🚧 UI Only / Dummy Data (Coming Soon)

The following features exist in the UI to demonstrate the design and UX, but are not yet fully connected to the backend logic:

- **AI Features**: The "AI Summary" banner at the top of emails and the "Decision Log" (Open Questions / Action Items) are currently static mock text.
- **Smart Chips / Third-Party Integrations**: 
  - "Send to Slack" button
  - "Add to calendar" smart chip
  - "Create Linear issue" smart chip
  - *Note: Clicking these currently displays a "Coming Soon" alert.*
- **Advanced Filtering**: The filter icon next to the search bar is non-functional.
- **Priority Badges**: Priority tags (Urgent/Normal/FYI) on emails are currently hardcoded/fallback placeholders.

## 📂 Project Structure

- `app/api/`: Contains all Next.js API routes including Authentication (`auth/`), the AI Agent endpoints (`chat/route.ts`), Webhooks (`webhooks/corsair/route.ts`), and Cron Jobs (`cron/digest/route.ts`).
- `app/(app)/`: The main authenticated application interface, including the Inbox, Calendar, and Agent views.
- `components/`: Reusable React components including the core layout, command palettes, and the specialized `AgentChatUI`.
- `lib/`: Core utilities including Prisma client instantiation (`prisma.ts`), Redis connection (`redis.ts`), Auth helpers (`auth.ts`), and AI configurations (`ai.ts`).
- `services/`: Encapsulated business logic for interacting with Corsair and Google APIs (`calendar.service.ts`, `EventDetectionService.ts`).

## 💻 Getting Started

To run the project locally, you will need a PostgreSQL database (preferably Neon for pgvector support), a Redis instance, and Corsair API keys.

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy the `.env.example` to `.env` and fill in the required keys.
   ```bash
   cp .env.example .env
   ```
   *Crucial variables include:*
   - `DATABASE_URL`: PostgreSQL connection string.
   - `REDIS_URL`: Redis connection string (defaults to `redis://localhost:6380`).
   - `NEXT_PUBLIC_APP_URL`: Your local or production URL.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: For OAuth.
   - `CORSAIR_API_KEY` / `CORSAIR_DEV_KEY` / `CORSAIR_KEK`: For Corsair integrations.
   - `MISTRAL_API_KEY`: For the Vercel AI SDK.

3. **Database Setup**:
   Generate the Prisma client and push the schema to your database.
   ```bash
   npm run postinstall
   npx prisma db push
   ```

4. **Start Background Services** (if using Docker for DB/Redis):
   ```bash
   docker-compose up -d
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Generates the Prisma client and builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to catch errors.
- `npm run tunnel`: Uses ngrok to expose your local server to the internet (useful for testing Corsair webhooks locally).
