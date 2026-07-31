# Agent Prompt: Build UnboundYou CRM & Kanban Dashboard

Copy and paste this prompt to your coding agent to implement the entire project:

---

## Instructions for Coding Agent

### Objective
Build a premium internal CRM and lead management platform for UnboundYou. The app combines the design quality of Linear and Vercel, the clean productivity of Notion, and the efficiency of modern SaaS. It allows counselors and admins to manually enter parent leads, assign them to tickets, track them across a Kanban board, automate daily checklist generation, and dynamically prioritize tasks using a user-configurable rules engine.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Zustand (State Management), dnd-kit (Kanban drag-and-drop), Recharts (Analytics).
- **Backend**: Supabase PostgreSQL (auth, database tables, real-time subscriptions, client client-sdk).

---

### Step-by-Step Implementation Flow

#### Phase 1: Initialize Next.js 15 Project & Styling Setup
1. Create a fresh Next.js project with Tailwind CSS v4 and TypeScript.
2. Replace the main CSS file (usually `app/globals.css`) with the following official UnboundYou branding stylesheet:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   @layer base {
     html {
       font-size: 15px;
     }
   }

   @import "tailwindcss";

   @theme {
     --color-background: var(--bg-base);
     --color-foreground: var(--text-primary);
     --color-muted: var(--text-muted);
     --color-primary: #2F80F9;
     --color-secondary: #08BD7E;
     --animate-marquee: marquee 35s linear infinite;

     @keyframes marquee {
       from { transform: translateX(0); }
       to { transform: translateX(-100%); }
     }
   }

   @font-face {
     font-family: 'Inter';
     src: url('https://www.unboundyou.com/_next/static/media/ba9851c3c22cd980-s.woff2') format('woff2');
     font-weight: normal;
     font-style: normal;
     font-display: swap;
   }

   :root {
     --bg-base: #FFFFFF;
     --bg-panel: #F9FAFB;
     --text-primary: #0F1729;
     --text-muted: #65758B;
     --brand-blue: #2F80F9;
     --brand-green: #08BD7E;
     --font-inter: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
   }

   * {
     box-sizing: border-box;
   }

   body {
     background-color: var(--bg-base);
     color: var(--text-primary);
     font-family: var(--font-inter);
     overflow-x: hidden;
     -webkit-font-smoothing: antialiased;
   }

   .inter {
     font-family: var(--font-inter);
   }

   h1, h2, h3, h4, h5, h6 {
     font-family: var(--font-inter);
     font-weight: 700;
     color: var(--text-primary);
     letter-spacing: -0.02em;
   }

   p {
     color: var(--text-muted);
     line-height: 1.6;
   }

   html {
     scroll-behavior: smooth;
   }

   ::-webkit-scrollbar {
     width: 6px;
   }
   ::-webkit-scrollbar-track {
     background: transparent;
   }
   ::-webkit-scrollbar-thumb {
     background: var(--brand-blue);
     border-radius: 3px;
   }
   ::selection {
     background: var(--brand-blue);
     color: white;
   }
   .perspective-1000 {
     perspective: 1000px;
   }
   .scrollbar-hide::-webkit-scrollbar {
     display: none;
   }
   .scrollbar-hide {
     -ms-overflow-style: none;
     scrollbar-width: none;
   }
   ```
3. Use the official UnboundYou logo for the sidebar/navbar header:
   `https://demobooking.unboundyou.com/_next/image?url=%2Flogo.png&w=640&q=75`

#### Phase 2: Database Integration
1. Set up a Supabase project and create the schema as detailed in `schema.sql`.
2. Connect the Next.js app to Supabase using `@supabase/ssr` or `@supabase/supabase-js`.
3. Enable real-time replication for the `tickets`, `leads`, `tasks`, and `activities` tables.

#### Phase 3: Priority Engine & Dynamic Rules UI
1. Implement the priority rules engine as detailed in `priority-rules-spec.md`.
2. Create the Settings page with the **Dynamic Rule Builder** form allowing admins to create rules, assign points, set operators, and toggle active/inactive rules.
3. Hook database triggers or Server Actions to re-run `calculatePriority` whenever a ticket's stage, value, or type changes, writing the new score and priority label (`Critical`, `High`, `Medium`, `Low`) back to the DB.

#### Phase 4: Auto-Todo Generator on Kanban Transition
1. Whenever a Ticket changes columns on the Kanban board (or the database `stage` is updated):
   - Trigger a handler that checks the new stage.
   - Automatically insert tasks related to that stage:
     - **Session Scheduled**: Call parent, Confirm Zoom slot, Send meeting link, Schedule 24h reminder.
     - **Payment Pending**: Generate invoice, Send reminder, Verify transfer, Send confirmation.
     - **Converted**: Set up student account, Add to system, Create onboarding.
2. Display these checklist tasks directly on the Ticket Page and aggregate them in the "My Today's To-Do" screen.

#### Phase 5: Core Layout & Kanban Board Component
1. Create a Sidebar navigation featuring: `Dashboard`, `Kanban Board`, `Leads`, `Tickets`, `Tasks`, `Rules / Settings`, `Analytics`.
2. Build the Kanban Board using `dnd-kit` with the following columns:
   - *New Leads, Contacted, Session Scheduled, Session Completed, Follow Up, Interested, Payment Pending, Converted, Closed, Dropped*.
3. Style the cards with a clean Linear-style design: displaying student/parent name, estimated value, priority level badge (color-coded), days inactive, next task due, and counselor avatar.
4. Implement Framer Motion for:
   - Spring-based drag animations.
   - Smooth slide transitions when cards shift columns.
   - Subtle hover lift (`scale: 1.02`).

#### Phase 6: Ticket Detail Page (Two-Column Layout)
1. Left column: Ticket title, type, rich editor for Description, Auto-generated Tasks Checklist (add/complete items), Activity Log timeline showing all changes (e.g., *"Counselor Sumit moved card to Session Scheduled"*), and an Internal Notes feed.
2. Right column (Sticky metadata sidebar): Parent details, student details, calculated priority score & level, counselor assigned, estimated revenue value, and Quick Actions (call, whatsapp, email buttons).

#### Phase 7: Dashboard Widget Panel
1. Greet counselor by name.
2. Display summary metrics (Potential Revenue, Active Tickets, Overdue Tasks, Today's Sessions).
3. "Critical & High Queue" listing the top-scoring tickets sorted by `priority_score` descending.
4. "My Today's Tasks" checklist.

---

### UX/UI Polish Checklist
- **Command Palette**: Press `Ctrl + K` to open search across all leads, tickets, and tasks, with quick shortcuts to create new records.
- **Animations**: Subtle, short transitions (150ms-250ms). Stagger list displays. No bouncy/gimmicky effects.
- **Colors**: Rely purely on white (`#FFFFFF`), light gray panel background (`#F9FAFB`), deep gray text (`#0F1729`), and the brand accents (`#2F80F9` & `#08BD7E`). Use soft 1px borders and subtle shadows instead of loud backgrounds.
- **Form validation**: Ensure parent name, estimated value, and phone/email are validated via React Hook Form and Zod before submission.
