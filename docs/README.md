# UnboundYou CRM & Kanban Dashboard

A premium, fast, and minimal internal Lead Management and Ticketing Dashboard built with **Next.js (App Router)** and **Supabase (PostgreSQL)**. 

Designed for counselors and administrators to manually log parent queries/leads, assign tickets, track tasks via a premium Kanban board, and automatically prioritize work using a custom, user-defined rules engine.

## Table of Contents
1. [Architecture & DB Choice](file:///d:/work/kanban/README.md#architecture--db-choice)
2. [Database Schema](file:///d:/work/kanban/schema.sql)
3. [User-Defined Priority Engine Specification](file:///d:/work/kanban/priority-rules-spec.md)
4. [Prompt for Coding Agent](file:///d:/work/kanban/agent-prompt.md)

---

## Architecture & DB Choice

We recommend **Supabase PostgreSQL** over Google Firestore for this project due to the following core requirements:

1. **Relational Data Modeling**: 
   - A `lead` (the parent/conversation) has multiple `tickets` (specific queries/actions like rescheduling or payment).
   - Each `ticket` has multiple `tasks` (to-do items generated automatically).
   - `activities` (history/audits) link to tickets, leads, and users.
   - Doing joins, aggregation, and cascading deletes in Firestore is complex and requires multiple database reads. Postgres handles this natively with SQL constraints.
   
2. **Dynamic Sorting and Filtering**:
   - The Kanban board must order tickets dynamically by `priority_score` (calculated on-the-fly or updated on changes) and `due_date`.
   - Firestore requires complex composite indexes for multi-property sorting (e.g., sorting by priority AND stage AND due date) and fails when doing dynamic, ad-hoc filters.
   
3. **User-Defined Rules Engine**:
   - Storing user-customizable rules (e.g., "If estimated value is > ₹50,000, add 40 points") and evaluating them across leads is simple using Postgres relational queries or an Edge Function.
   
4. **Realtime Capabilities**:
   - Like Firestore, Supabase provides out-of-the-box Realtime Subscriptions, allowing multi-user collaboration (e.g., drag-and-drop a card on the Kanban board updates the UI instantly for other counselors).
