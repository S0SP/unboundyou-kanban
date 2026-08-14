# UnboundYou CRM & Kanban Dashboard

A premium, high-performance, and minimal internal Lead Management and Ticketing Dashboard built with **Next.js (App Router)**, **TypeScript**, and **Supabase (PostgreSQL)**. This dashboard enables counselors and administrators to log parent inquiries, assign tickets, track tasks via a premium Kanban board, and automatically prioritize tasks using a dynamic, user-defined rules engine.

---

## 🚀 Deployment Overview

Deploying the UnboundYou CRM dashboard requires setting up two primary components:
1. **Database & Auth Backend**: Managed via [Supabase](https://supabase.com).
2. **Web Frontend Hosting**: Hosted via [Vercel](https://vercel.com) (standard for Next.js App Router applications).

---

## 🛠️ Step 1: Database Setup (Supabase)

The database layers are structured in PostgreSQL, utilizing relational mappings, triggers, and Row Level Security (RLS).

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **New Project** and select your Organization.
3. Configure your project name, database password, and region. Note your database password safely.

### 2. Apply the Database Schema
To build your database architecture (tables, relational integrity, triggers, RLS policies, seed data, and RPC functions), execute the schema definition script:

1. In the Supabase Sidebar, navigate to the **SQL Editor**.
2. Click **New Query**.
3. Copy the full contents of the schema file: [docs/schema.sql](file:///d:/work/kanban/docs/schema.sql).
4. Click **Run** to execute the script.

> [!IMPORTANT]
> The database schema includes a database trigger (`on_auth_user_created`) that automatically maps newly authenticated auth users to the public `users` profile table. This ensures counselor profiles are synced instantly upon signup.

### 3. Verification of SQL Deployment
Ensure the following tables are populated in the database:
- `users`: Counselor and administrator profiles.
- `ticket_types`: Dynamic enums of ticket categories (seeded with values like `Scheduling`, `Rescheduling`, `Admission Inquiry`, `Payment Issue`).
- `leads`: Core parent & student query records.
- `tickets`: Main support tickets tracked on the Kanban board.
- `tasks`: Actionable check-list sub-items under a ticket.
- `priority_rules`: Configuration for the custom rules engine.
- `activities`: History logs and audit trails.
- `notes`: Internal counselor notes.

---

## 🔑 Step 2: Configure Environment Variables

To link the Next.js frontend with the Supabase backend, you must configure your API keys.

1. Navigate to **Project Settings** > **API** in the Supabase Dashboard.
2. Retrieve the following credentials:
   - **Project URL**
   - **API Key (anon/public)**

3. Create a `.env.local` file in the root of your project directory (referenced in [package.json](file:///d:/work/kanban/package.json)):

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> [!NOTE]
> Next.js loads these variables automatically during local development and builds. The initialization client verifies these keys in [lib/db.ts](file:///d:/work/kanban/lib/db.ts).

---

## 💻 Step 3: Local Development Setup

To test the project locally:

### 1. Install Dependencies
Ensure you have Node.js (v18+) installed. Run:
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Code Linting & Build Verification
Prior to deploying to production, run checks to prevent build breakages:
```bash
# Run ESLint validation
npm run lint

# Build the production bundle locally
npm run build
```

---

## 🌐 Step 4: Production Frontend Deployment (Vercel)

Vercel is the recommended hosting platform for Next.js applications, providing edge routing, image optimization, and seamless serverless functions out of the box.

### 1. Import Git Repository
1. Push your project to a git provider (GitHub, GitLab, or Bitbucket).
2. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** > **Project**.
3. Import your project repository.

### 2. Configure Build Settings
Vercel automatically detects Next.js configurations. Confirm the default settings:
- **Framework Preset**: `Next.js`
- **Root Directory**: `./`
- **Build Command**: `npm run build` (runs `next build` from [package.json](file:///d:/work/kanban/package.json))
- **Output Directory**: `.next`

### 3. Add Environment Variables
Add the environment keys in Vercel's **Environment Variables** section during configuration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Deploy
Click **Deploy**. Vercel will build and launch your application, provisioning a secure HTTPS domain.

---

## 🔐 Step 5: Authentication Configuration

The CRM relies on Supabase Auth for counselor/administrator log-ins.

1. In the Supabase Dashboard, go to **Authentication** > **URL Configuration**.
2. **Site URL**: Enter your production web application URL (e.g., `https://your-app.vercel.app`).
3. **Redirect URLs**: Add both your local development URL and production redirects:
   - `http://localhost:3000/**`
   - `https://your-app.vercel.app/**`

> [!TIP]
> If Google Login OAuth is preferred for administrative sign-in, configure the credentials in **Authentication** > **Providers** > **Google** on the Supabase dashboard.

---

## ⚙️ Architecture & Core Components Reference

- **Database Client**: Client instantiation logic is in [lib/db.ts](file:///d:/work/kanban/lib/db.ts).
- **Priority Rules Engine**: Dynamic prioritization calculation logic is handled inside [lib/priorityEngine.ts](file:///d:/work/kanban/lib/priorityEngine.ts). A detailed specification of rule building and evaluation is stored in [docs/priority-rules-spec.md](file:///d:/work/kanban/docs/priority-rules-spec.md).
- **Global State Store**: Kanban board state and lead synchronization are managed via Zustand in [lib/useStore.ts](file:///d:/work/kanban/lib/useStore.ts).
- **Core Architecture Choices**: Detailed explanations regarding the selection of Supabase Postgres over Firebase Firestore are documented in [docs/README.md](file:///d:/work/kanban/docs/README.md).
