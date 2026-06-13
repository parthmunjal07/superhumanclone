# Superhuman Clone

A high-performance, keyboard-centric email and calendar client inspired by Superhuman. Built with Next.js App Router, Tailwind CSS, Prisma, and Corsair for deep Google Workspace integration.

## 🚀 Current State of the Project

This project is actively in development. Below is a breakdown of what is fully functional (wired to the backend/APIs) and what is currently mocked UI.

### ✅ Fully Functional (Wired to Backend)

- **Authentication**: Fully working Google OAuth flow.
- **Inbox Syncing**: 
  - Real-time email fetching from your actual Gmail account.
  - Emails are correctly sorted by date (newest first).
  - Search functionality successfully queries your live inbox.
- **Email Actions**: 
  - **Read**: View sanitized HTML bodies of your actual emails in the reading pane.
  - **Archive**: Removes the `INBOX` label from the email in Gmail.
  - **Delete (Trash)**: Moves the email to the Trash folder in Gmail.
  - **Reply / Forward / Compose**: The compose modal is functional and successfully sends emails via the Gmail API.
- **Calendar Integration**: 
  - Fetches events across all your active (non-holiday) Google Calendars.
  - Fully working Day, Week, and Month views that correctly map your real events to a visual timeline.
- **Sidebar**: Dynamic user profile display (pulls your name/initials) and working Logout functionality.
- **Keyboard Shortcuts**: Basic global shortcuts are wired up:
  - `c`: Compose new email
  - `e`: Archive selected email
  - `r`: Reply to selected email
  - `/`: Focus search bar
  - `?`: Toggle shortcut overlay

### 🚧 UI Only / Dummy Data (Coming Soon)

The following features exist in the UI to demonstrate the design and UX, but are not yet connected to real backend logic:

- **AI Features**: The "AI Summary" banner at the top of emails and the "Decision Log" (Open Questions / Action Items) are currently static mock text.
- **Smart Chips / Third-Party Integrations**: 
  - "Send to Slack" button
  - "Add to calendar" smart chip
  - "Create Linear issue" smart chip
  - *Note: Clicking these currently displays a "Coming Soon" alert.*
- **Advanced Filtering**: The filter icon next to the search bar is non-functional.
- **Sidebar Modules**: The "Digest", "Agent", and "Settings" tabs in the sidebar navigate to placeholder pages without full implementation.
- **Priority Badges**: Priority tags (Urgent/Normal/FYI) on emails are currently hardcoded/fallback placeholders.

## 🛠 Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS (with custom scrollbars and animations)
- **Database**: Prisma ORM
- **Integrations & Auth**: Corsair (Gmail API, Google Calendar API, DB Cache)
- **Data Fetching**: SWR for optimistic UI updates and real-time caching

## 💻 Getting Started

To run the project locally:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure you have authenticated with Corsair CLI locally so your API routes have access to Google Workspace tokens.
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser.
