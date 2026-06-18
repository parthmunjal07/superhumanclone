# Meridian: AI-First Email & Calendar Client

Meridian is a high-performance, intelligent email and calendar application built for speed and autonomy. It leverages agentic AI to help users triage emails, manage schedules, and synthesize daily tasks through a streamlined, neo-minimalist interface.

## 🌟 Core Features

*   **Agentic AI Assistant:** A built-in chat interface (`AgentChatUI.tsx`) powered by the Vercel AI SDK (`lib/ai.ts`) that executes complex tasks using natural language.
*   **Voice Commands:** Integrated voice input capabilities utilizing `useVoiceInput.ts` and visualized via the `Waveform.tsx` component.
*   **Morning Digest:** An AI-generated daily briefing (`app/(app)/digest/page.tsx`) that synthesizes important emails, action items, and meetings, powered by background cron jobs (`app/api/cron/digest/route.ts`)[cite: 5].
*   **Inbox Management:** A dedicated inbox interface (`app/(app)/inbox/page.tsx`) with features for reading (`ReadingPane.tsx`), composing (`ComposeModal.tsx`), archiving, and deleting emails[cite: 5].
*   **Smart Calendar:** A fully integrated calendar (`app/(app)/calendar/page.tsx`) supporting event creation (`CreateEventModal.tsx`), free/busy tracking, and automated Google Meet link generation[cite: 5].
*   **Corsair MCP Integration:** Deep integration with Corsair (`lib/corsair.ts`) to autonomously execute Gmail and Google Calendar API calls on behalf of the user[cite: 5].
*   **Keyboard-Centric Navigation:** Designed for power users, featuring global keyboard shortcuts managed by `ShortcutOverlay.tsx`[cite: 5].
*   **Demo Mode:** A frictionless authentication bypass (`app/api/auth/demo/route.ts`) allowing recruiters and visitors to experience the app without connecting real Google accounts[cite: 5].

## 🛠 Tech Stack

*   **Framework:** Next.js 14 (App Router)[cite: 5].
*   **Language:** TypeScript (`tsconfig.json`, `.tsx`/`.ts` files throughout the project)[cite: 5].
*   **Styling:** Tailwind CSS (`postcss.config.mjs`, `app/globals.css`)[cite: 5].
*   **Database & ORM:** PostgreSQL managed via Prisma (`prisma/schema.prisma`, `lib/prisma.ts`)[cite: 5].
*   **Caching & Rate Limiting:** Redis integration (`lib/redis.ts`)[cite: 5].
*   **AI Integration:** Vercel AI SDK (`.agents/skills/ai-sdk/`, `lib/ai.ts`)[cite: 5].
*   **Authentication:** Custom JWT authentication alongside Google OAuth (`lib/auth.ts`, `app/api/auth/`)[cite: 5].
*   **Infrastructure:** Docker containerization (`docker-compose.yml`) and Vercel deployment configurations (`vercel.json`)[cite: 5].

## 📂 Application Architecture

The repository is structured following Next.js App Router best practices, separated into distinct functional domains[cite: 5].

### Next.js App Router (`app/`)
*   **`app/(app)/`**: Contains the core authenticated application views[cite: 5].
    *   `agent/page.tsx`: The dedicated full-page AI agent interface[cite: 5].
    *   `calendar/page.tsx`: The primary calendar view[cite: 5].
    *   `digest/page.tsx`: The Morning Digest summary view[cite: 5].
    *   `inbox/page.tsx`: The main email triage interface[cite: 5].
    *   `settings/page.tsx`: User configuration and integration management[cite: 5].
    *   `layout.tsx`: The standard application layout wrapper[cite: 5].
*   **`app/(auth)/`**: Contains public-facing authentication routes[cite: 5].
    *   `login/page.tsx`: User sign-in interface[cite: 5].
    *   `register/page.tsx`: New user registration interface[cite: 5].
*   **`app/onboarding/page.tsx`**: New user setup and integration flow[cite: 5].
*   **`app/page.tsx`**: The main public landing page showcasing the product[cite: 5].

### API Routes (`app/api/`)
The application features an extensive REST API backend[cite: 5].

*   **Authentication APIs (`app/api/auth/`)**[cite: 5]:
    *   `/connect/calendar/route.ts`: Initializes Google Calendar integration[cite: 5].
    *   `/connect/gmail/route.ts`: Initializes Gmail integration[cite: 5].
    *   `/corsair/callback/route.ts`: Handles Corsair OAuth callbacks[cite: 5].
    *   `/demo/route.ts`: Manages Demo Mode sessions[cite: 5].
    *   `/google/route.ts` & `/google/callback/route.ts`: Native Google authentication[cite: 5].
    *   `/login/route.ts` & `/register/route.ts`: Standard user authentication[cite: 5].
    *   `/verify/route.ts` & `/resend-verification/route.ts`: Email verification logic[cite: 5].
*   **Calendar APIs (`app/api/calendar/`)**[cite: 5]:
    *   `/events/route.ts`: Fetching and creating calendar events[cite: 5].
    *   `/freebusy/route.ts`: Checking availability[cite: 5].
*   **Email APIs (`app/api/emails/`)**[cite: 5]:
    *   `/[id]/archive/route.ts`: Archiving specific emails[cite: 5].
    *   `/[id]/delete/route.ts`: Trashing specific emails[cite: 5].
    *   `/[id]/smart-chips/route.ts`: Generating contextual smart chips for messages[cite: 5].
    *   `/[id]/decision-log/route.ts`: Tracking AI decisions on specific emails[cite: 5].
    *   `/search/route.ts`: Searching the inbox[cite: 5].
    *   `/send/route.ts`: Dispatching outgoing emails[cite: 5].
*   **AI & System APIs**[cite: 5]:
    *   `app/api/chat/route.ts`: The primary Vercel AI SDK streaming endpoint[cite: 5].
    *   `app/api/digest/route.ts`: Fetching or regenerating the Morning Digest[cite: 5].
    *   `app/api/cron/digest/route.ts`: Background job for preemptive digest generation[cite: 5].
    *   `app/api/sse/route.ts`: Server-Sent Events for real-time UI updates[cite: 5].
    *   `app/api/webhooks/`: Webhook receivers for Corsair and incoming emails[cite: 5].

### UI Components (`components/`)
A modular library of React components tailored for a premium user experience[cite: 5].

*   **Agent Interaction**: `AgentChatUI.tsx`, `AgentDockWrapper.tsx`, `Waveform.tsx`[cite: 5].
*   **Email Handling**: `EmailItem.tsx`, `ComposeModal.tsx`, `ReadingPane.tsx`[cite: 5].
*   **Calendar Handling**: `CalendarSidebar.tsx`, `CreateEventModal.tsx`, `EventModal.tsx`[cite: 5].
*   **Navigation & Layout**: `Sidebar.tsx`, `ShortcutOverlay.tsx`[cite: 5].
*   **Security & Settings**: `ProtectedRoute.tsx`, `DisconnectButton.tsx`[cite: 5].
*   **Base UI**: Contains primitive components such as `ui/button.tsx` configured by `components.json`[cite: 5].

### Services (`services/`)
Encapsulated business logic abstraction layers[cite: 5].
*   `calendar.service.ts`: Handles Google Calendar API formatting, Meet links, and attendees[cite: 5].
*   `email.service.ts`: Handles Gmail fetching, sanitization, and sending logic[cite: 5].
*   `EventDetectionService.ts`: Analyzes text/emails to automatically detect schedulable events[cite: 5].

### Libraries & Core Utilities (`lib/`)
*   `ai.ts`: Model configurations and prompt sanitization[cite: 5].
*   `auth.ts`: JWT signing, verification, and cookie management[cite: 5].
*   `corsair.ts`: Corsair MCP client instantiation[cite: 5].
*   `digest.ts`: Logic for synthesizing user data into the Morning Digest JSON format[cite: 5].
*   `prisma.ts`: Prisma database client singleton[cite: 5].
*   `redis.ts`: Redis connection and caching functions[cite: 5].
*   `rbac.ts` & `permissions.ts`: Role-Based Access Control and capability limits[cite: 5].
*   `utils.ts`: Generic helpers and Tailwind class mergers (`cn`)[cite: 5].

### Data Validation (`schemas/`)
*   `calendar.schema.ts`: Zod schemas for calendar event inputs[cite: 5].
*   `email.schema.ts`: Zod schemas for email validation[cite: 5].

## 🔐 Security & Access Control
*   **Role-Based Limitations:** The platform distinguishes between Free and Pro tiers, managed through `lib/rbac.ts` and `lib/permissions.ts`[cite: 5].
*   **Auth Gates:** Protected routes enforce authentication at the component level (`components/ProtectedRoute.tsx`) and the API level[cite: 5].
*   **Token Management:** Credentials and connection states can be actively revoked via `test-disconnect.ts` and `app/api/test_cred/disconnect/route.ts`[cite: 5].

## 🧪 Testing & Scripts
The repository includes several scratchpads and scripts for testing integrations without hitting the frontend[cite: 5].
*   **Database Seeding:** `scripts/seed.ts` populates initial test data[cite: 5].
*   **OAuth Testing:** `scratch_fetch_oauth.ts`, `scratch_test_oauth.ts`, and `scratch_test_oauth_https.js` validate Google/Corsair handshake flows[cite: 5].
*   **Instance & MCP Testing:** `test-creds.mjs`, `test-fetch.mjs`, `test-instance.mjs`, and `test-mcp.mjs` verify model context protocol connections[cite: 5].

## 🚀 Setup & Installation

**1. Clone the repository**
Install dependencies utilizing the package manager (`package.json`, `package-lock.json`)[cite: 5].

**2. Environment Configuration**
Configure necessary environment variables for Next.js, Postgres, Redis, Google OAuth, and Corsair[cite: 5].

**3. Infrastructure Setup**
Start required local services (like Redis/Postgres) using the provided Docker configuration[cite: 5]:
```bash
docker-compose up -d
4. Database Migration
Initialize the database schemas defined in prisma/schema.prisma[cite: 5].
Bash

npx prisma db push
npx prisma generate

5. Start the Development Server
Bash

npm run dev