# Architecture Reference

## Stack

- **Next.js 16.2.1** — App Router (in `src/app/`). See AGENTS.md warning about breaking changes.
- **TypeScript** — strict mode; path alias `@/*` → `./src/*`
- **Tailwind CSS v4** — configured via `@tailwindcss/postcss` (no `tailwind.config.js`)
- **Prisma 7** — import from `@/generated/prisma/client` (NOT `@prisma/client`). Uses `prisma.config.ts` pattern, not URL in `schema.prisma`. Run `prisma generate` before every build.
- **Neon (PostgreSQL)** — `PrismaNeon` adapter required in PrismaClient constructor
- **NextAuth.js v5 beta** — JWT session strategy (NOT database). `AUTH_SECRET` env var (not `NEXTAUTH_SECRET`). Credentials provider is incompatible with database sessions.

## Data Models

- **User** — id, name, email, avatar, bio, interests (string[]), location, rating (float), activityCount (int)
- **Activity** — id, hostId, title, description, tags (string[]), dateTime, location, locationLat, locationLng, maxSpots, status (open/full/completed/cancelled)
- **JoinRequest** — id, activityId, userId, status (pending/approved/declined), compatibilityScore (float)
- **Rating** — id, raterId, rateeId, activityId, score (int 1–5)

## Compatibility Scoring Algorithm

**Status: implemented and fully tested — 29 passing unit tests (Groups A–D).**

Produces a 0–100 score per join request:

| Factor | Weight |
|---|---|
| Shared interest tags (requester ↔ activity tags) | 40% |
| Proximity (requester location ↔ activity location) | 30% |
| Requester's average rating | 20% |
| Requester's completed activity count | 10% |

Key edge cases: new users (no rating/history) → neutral/default score; no matching tags → minimum score (not zero); self-join → reject; full activity → block request; past-date activity → hide from feed.
