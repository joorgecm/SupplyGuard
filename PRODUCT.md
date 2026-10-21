# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Operator** at the goods-receiving dock / incoming inspection bench. Spots a defective lot (e.g. off-centre holes in brackets from supplier "Metalex") and logs an incident quickly: part, lot, supplier, severity, description, photo. Then checks what happened to it.
- **Quality engineer** at a desk. Takes ownership of open incidents, analyses them, writes the action plan, assigns tasks with owners and due dates, and closes the incident once every task is done.
- **Admin** manages users and roles (and suppliers/parts via the API).
- Secondary audience: recruiters and reviewers looking at a personal portfolio project. The tool must read as a credible plant tool first; that credibility is what impresses.

## Product Purpose

Register, analyse, resolve and measure incidents caused by defective parts received from suppliers. Success: nothing open is forgotten, every incident has a traceable history (who did what and when), and the team can see which suppliers cause most trouble and how long incidents take to close.

## Positioning

Built around the real incoming-quality workflow: `open → in analysis → corrective action → closed`, with the rule that an incident can only be closed when every corrective task is done. Personal portfolio project inspired by incoming quality management in a manufacturing plant; not a commercial product.

## Operating Context

- Incident workflow and roles enforced by a FastAPI backend with JWT; the role is read from the DB on every request.
- Roles: operator (create and view incidents, complete own tasks), engineer (analyse, plans, tasks, status changes), admin (everything plus users, suppliers, parts).
- KPIs: open incidents, average time to close, supplier ranking by incidents.
- Domain vocabulary: part reference, lot, supplier, severity (low/medium/high/critical), action plan, task, 8D report, containment, quarantine.

## Capabilities and Constraints

- Frontend: Next.js 16 (App Router, cache components), Tailwind v4, Recharts, lucide-react, sonner. Server-side API calls with an httpOnly cookie session.
- UI copy in English. Code and commits in English.
- No photo upload: incidents carry an optional photo URL.
- KPIs are computed in the frontend from the incident list.
- Not decided yet: PDF incident sheet, webhook notifications, BigQuery export (later phases).

## Evidence on Hand

- Demo dataset from `backend/app/scripts/seed_demo.py`: 5 suppliers, 16 part lots, 28 incidents over ~5 months, 5 demo users (password `demo1234`). It is synthetic; never present it as real plant data.
- No logo, customers, testimonials or metrics exist; do not invent them.

## Product Principles

1. The workflow is the interface: the current step and the next action are always obvious.
2. Traceability over decoration: who, what, when is visible wherever it matters.
3. Fast at the dock: an operator can log an incident in under a minute.
4. Role-aware: each role sees what it can act on, never dead buttons.
5. Honest data: synthetic demo data is labelled; numbers are never faked.
