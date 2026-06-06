# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Domain language lives in [CONTEXT.md](./CONTEXT.md) (the glossary). Hard,
> deliberate decisions live in [docs/adr/](./docs/adr/). Read both before
> changing behavior — several defaults here are intentional reversals of the
> "obvious" choice.

## Project Overview

Homeschool Hub is a **calm planning tool for newcomer homeschooling parents** —
an "external brain" built around a weekly rhythm. The user offloads memory and
planning to a trusted system she depends on like a calendar (retention is good),
while the *rhythm itself* teaches a sustainable habit.

- **Primary user:** a newcomer homeschool mom (0–2 years in), mobile-heavy,
  overwhelmed. Real first user: the builder's sister-in-law.
- **Real pain being solved:** not "disorganization" — it's *anxiety + lack of
  rhythm*. "What are we doing today?" and "are we doing enough?"
- **This is a 1-week MVP** for a single real user (a gift / learning project).
  Build for her, not for imaginary strangers.

The long-term "Homeschool Operating System" (community, sharing, marketplace, AI)
is **parked — maybe later, maybe never.** Do not build toward it now.

## The Core Loop (this *is* the product)

```
Capture an idea → drain the Inbox into the week's plan → see Today
   → check it off → gentle weekly recap → repeat next week
```

Resource → Inbox → Task → Today → Done → Recap. Everything serves this loop.
If a feature doesn't help build a sustainable weekly rhythm, it's out of scope.

## MVP Scope

**In (week 1):**
- Google login (Auth.js)
- Two-step setup (kids → subjects) that generates a pre-filled **Starter week**
- **Today** view — the whole family's tasks for today, filterable to one child
- **Weekly plan** — tap an Inbox item into day(s), assign one/many/all children,
  weekday multi-select (M–F) when creating
- **Copy last week → this week** (the rhythm compounds; ~5-min Sundays by week 4)
- Check tasks off
- **Quick-add to Inbox** — a bare link with no title is a valid item
- **Win-only weekly recap** ("You did 14 things with the kids this week 💛")

**Out (parked):** standalone resource library/vault, categories, child age/grade,
streaks, %-complete bars, push notifications, social/community, meetups, AI,
courses, household / co-parent sharing.

## Design Principles

- **Calm, warm, family-oriented.** No corporate/enterprise dashboard feel.
- **An unchecked box is never an accusation.** Unfinished tasks silently stay in
  the past — no red, no "overdue," no auto roll-forward. No streaks, no
  %-complete. Positive feedback is win-only. See **ADR 0001** — do not "fix" this.
- **Mobile-first.** Design for the phone first, desktop second.
- **Forgiving capture.** Organizing happens at planning time, not capture time.

## Tech Stack

- **Framework:** Next.js (App Router) + **TypeScript**
- **Styling:** Tailwind CSS + shadcn/ui
- **API:** Next.js Route Handlers
- **ORM:** **Prisma** (end-to-end types with TS + Auth.js)
- **Database:** **PostgreSQL** on **Neon** (ADR 0003)
- **Auth:** **Auth.js (NextAuth) + Google** sign-in — no passwords (ADR 0002)
- **Hosting:** **Vercel** (app) + Neon (database)
- **Delivery:** mobile-first responsive web (PWA/notifications deliberately deferred)

## Data Model

```
User        ← identity managed by Auth.js (Google). No password field.
 └─ owns all of the below (everything keyed to userId; single owner per family)

Child       userId · name · color
Task        userId · title · description? · date · completed
              children: many-to-many → Child   (shareable: one task, many kids / all)
              resourceId? → Resource           (open the source while doing it)
              (NO recurrence rule — repeats are independent materialized rows)
Resource    userId · url? · title? · note? · planned   (an Inbox item; drains into Tasks)
```

Key modeling rules:
- **Tasks are shareable** across children (many-to-many), with an "everyone" shortcut.
- **Recurrence = materialized rows.** Weekday multi-select and "copy last week"
  just *create independent Task rows*. Never store an RRULE; never build
  this/all-future edit semantics. Each row is an ordinary, independent task.
- **Resource is an Inbox item** meant to drain into the plan, not a library.

## Development Commands

```bash
npm install        # install dependencies
npm run dev        # start the Next.js dev server
npx prisma migrate dev   # apply database migrations (after schema changes)
npx prisma studio        # browse the database
npm run build      # production build
npm start          # serve production build
```

## Git Workflow

- **main**: production-ready. Branch off for features; open PRs into `main`.
- Commit with clear, descriptive messages.

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage labels, default names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Notes for Claude

- The project is greenfield (not yet scaffolded as a Next.js app). When
  scaffolding, match the stack above.
- Keep `CONTEXT.md` (glossary) and `docs/adr/` up to date as decisions are made.
- Before adding anything that nags, ranks, scores, or streaks the user — stop and
  re-read ADR 0001. That tone is the product.
