# OdishaRank — Prepare Today. Rank Tomorrow.

A production-oriented competitive examination preparation platform engineered specifically for Odisha Government recruitments, including:
- **OSSC CGL** (Odisha Staff Selection Commission Combined Graduate Level)
- **OSSC Combined Recruitment** (RI, AMIN, ARI, ICDS Supervisor)
- **OPSC Civil Services** (Odisha Administrative Service / OAS)

---

## 1. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 14.2.15 | Server Components, dynamic streaming, SEO |
| **Language** | TypeScript | ^5.6.3 | Strict type-safety across domain models |
| **Library** | React / React DOM | ^18.3.1 | Client interactivity for timed mock exams |
| **Styling** | Tailwind CSS & PostCSS | ^3.4.14 | Slate surfaces, brand palette, responsive design |
| **Icons** | Lucide React | ^0.453.0 | Modern educational and UI iconography |
| **Database** | Supabase PostgreSQL | ^2.45.6 | Relational tables, indexes, RLS policies |
| **Auth** | Supabase SSR & Auth | ^0.5.1 | Cookie-based session management |
| **Validation** | Zod & React Hook Form | ^3.23.8 / ^7.53.0 | Strict form schemas and runtime sanitization |
| **Hosting** | Vercel | Production | Serverless Edge and Node.js deployment |

---

## 2. Architecture & Domain Model

### Hierarchy
`Exam` &rarr; `Subject` &rarr; `Chapter` &rarr; `Topic` &rarr; `Study Material`

### Content Separation Rules
- **Official Content:** Controlled by OdishaRank editorial and state syllabus notifications. Read-only for students.
- **Custom Content:** Students can create personal custom chapters and topics. Students can edit and delete only their own items.
- **Metrics Integrity:** Student-created topics **never** artificially increase official syllabus completion metrics. Official progress and personal study progress are computed on separate tracks.

---

## 3. Database Schema & RLS Architecture

All migrations are located in `supabase/migrations/`:

1. `001_initial_schema.sql`:
   - Tables: `user_roles`, `profiles`, `exams`, `subjects`, `chapters`, `topics`, `study_materials`, `student_topic_progress`, `study_sessions`, `questions`, `question_attempts`, `mock_tests`, `mock_test_questions`, `mock_test_attempts`, `mock_test_answers`, `student_activity`.
   - Security: RLS enabled on all 16 tables.
   - Admin authorization: Driven by `public.user_roles` and `public.is_admin()` function (never editable via student profile).
   - Triggers: Auto-creates student profile and assigns default `'student'` role upon auth registration.

2. `002_seed_data.sql`:
   - Official Odisha examinations catalog (OSSC CGL, OSSSC CRE, OPSC OAS).
   - Core syllabus subjects (General Studies, Reasoning, Quantitative Aptitude, Odia, Computer).
   - Verified sample questions labeled as demo/sample with full explanations.
   - Initial full-length timed mock tests with negative marking configuration (-0.25).

---

## 4. Supabase Setup Instructions (Step-by-Step)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** &rarr; **New Query**.
3. Copy and run `supabase/migrations/001_initial_schema.sql`.
4. Copy and run `supabase/migrations/002_seed_data.sql`.
5. In **Authentication** &rarr; **URL Configuration**:
   - Set **Site URL** to your production URL (e.g. `https://your-domain.vercel.app` or `http://localhost:3000`).
   - Add Redirect URLs:
     - `https://your-domain.vercel.app/auth/callback`
     - `https://your-domain.vercel.app/reset-password`
     - `http://localhost:3000/auth/callback`
6. Go to **Project Settings** &rarr; **API**:
   - Copy **Project URL** &rarr; `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public key** &rarr; `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role secret key** &rarr; `SUPABASE_SERVICE_ROLE_KEY` (Server-only!)

---

## 5. Environment Variables

Create `.env.local` for development (modeled from `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

> **Security Note:** Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or prefix it with `NEXT_PUBLIC_`.

---

## 6. Local Development & Testing

```bash
# Install dependencies
npm install

# Run automated test suite (22 checks: validation, security, scoring, isolation)
npx tsx scripts/verify-all.ts

# Run local development server
npm run dev

# Run production build
npm run build
```

---

## 7. Deployment Instructions

### GitHub Repository Setup
> **Important:** To preserve any existing repository, create a dedicated new repository (e.g., `odisha-rank-platform`).

```bash
git remote add origin https://github.com/<your-username>/odisha-rank-platform.git
git branch -M main
git push -u origin main
```

### Vercel Hosting Setup
1. Import repository into [vercel.com](https://vercel.com).
2. Framework Preset: **Next.js**.
3. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Click **Deploy**.
