# AGENTS.md - Neosoul Tournament Platform

## Quick Start

```bash
npm install
npm run dev          # localhost:3000
npm run build        # production build (ALWAYS run before commit)
npm run lint         # ESLint check
```

## Project Identity

- **Name:** Neosoul Tournament Tracker (neosoulid)
- **Version:** v0.0.2 (Community Event Platform)
- **GitHub:** https://github.com/ajoikafeb/mobatourbracket.git
- **Live:** https://neosoulid.vercel.app
- **Vercel project:** 0-bomb/neosoulid
- **Database:** Supabase (https://hrrrjnoawqoikdbvdkeo.supabase.co)

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.10 |
| Language | TypeScript | ^5 |
| UI | React | 19.2.4 |
| Styling | TailwindCSS | v4 (NOT v3) |
| Animation | Framer Motion | ^12.42.2 |
| Icons | Lucide React | ^1.240 |
| Database | Supabase (PostgreSQL) | ^2.110.6 |
| Auth | Supabase Auth (SSR) | ^0.12.3 |
| Deploy | Vercel | - |
| Runtime | Bun (for ctx_execute sandbox) | - |

## CRITICAL: TailwindCSS v4

TailwindCSS v4 uses a **completely different config** than v3:

- NO `tailwind.config.js` / `tailwind.config.ts` file
- Config lives inside `src/app/globals.css` using `@theme` blocks
- NO `@apply` directives - use utility classes directly or inline styles
- Colors defined as CSS variables in `:root` / `.dark` blocks in globals.css
- To add custom colors/utilities, add them in the `@theme` block in globals.css
- Class merging: use `cn()` from `@/lib/utils` (clsx + tailwind-merge)

## Design System & Colors

All colors are CSS variables defined in `src/app/globals.css`:

```css
--background: 240 6% 3%;      /* #09090B - main bg */
--foreground: 0 0% 98%;        /* white text */
--primary: 24 100% 50%;        /* #FF7A00 - brand orange */
--secondary: 24 100% 58%;      /* #FFA726 */
--accent: 24 100% 46%;         /* darker orange */
--card: 240 6% 6%;             /* card bg */
--muted: 240 4% 46%;           /* muted text */
--destructive: 0 84% 60%;      /* red */
--border: 240 4% 16%;          /* borders */
```

Dark theme is the ONLY theme (forced via `class="dark"` on html element).

### Key Color Usage Rules
- Primary actions: `bg-[#FF7A00]` or `bg-orange-500` with white text
- Card backgrounds: `bg-white/[0.035]` with `border-white/[0.06]`
- Hover states: `hover:bg-white/[0.06]` or `hover:border-white/[0.1]`
- Status colors: green=success, yellow=pending, red=error, blue=info
- Text hierarchy: white -> zinc-300 -> zinc-400 -> zinc-500 -> zinc-600

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (dark theme, fonts)
│   ├── page.tsx                  # Public homepage
│   ├── globals.css               # TailwindCSS v4 config + theme
│   ├── not-found.tsx             # 404 page
│   ├── bracket/page.tsx          # Public bracket view
│   ├── current-match/page.tsx    # Public current match display
│   ├── schedule/page.tsx         # Public schedule view
│   ├── events/
│   │   ├── page.tsx              # Public event listing
│   │   ├── [slug]/page.tsx       # Public event detail
│   │   └── [slug]/register/page.tsx  # Public registration form
│   └── admin/
│       ├── layout.tsx            # Admin sidebar + auth guard
│       ├── login/page.tsx        # Admin login (Supabase Auth)
│       ├── dashboard/page.tsx    # Admin dashboard
│       ├── events/page.tsx       # Event management (CRUD)
│       ├── events/new/page.tsx   # Create event
│       ├── events/[id]/page.tsx  # Edit event
│       ├── events/[id]/form/page.tsx  # Form builder per event
│       ├── registrations/page.tsx # Registration management
│       ├── announcements/page.tsx # Announcement management
│       ├── tournament-generator/page.tsx  # 5-step tournament wizard
│       ├── schedule-generator/page.tsx    # Schedule wizard
│       ├── bracket/page.tsx      # Admin bracket editor + score editing
│       ├── schedule/page.tsx     # Admin schedule editor
│       ├── current-match/page.tsx # Admin current match controller
│       ├── export/page.tsx       # Data export
│       ├── settings/page.tsx     # Platform settings
│       └── announce/page.tsx     # Quick announcement page
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── button.tsx            # Button with variants (default, outline, ghost, etc.)
│   │   ├── card.tsx              # Card + CardContent
│   │   ├── input.tsx             # Input with dark theme styling
│   │   ├── select.tsx            # Select dropdown
│   │   ├── skeleton.tsx          # Loading skeleton
│   │   ├── badge.tsx             # Badge component
│   │   └── status-badge.tsx      # Status badge
│   ├── shared/                   # Shared components
│   │   ├── navbar.tsx            # Public navbar
│   │   ├── footer.tsx            # Public footer (social links from settings)
│   │   ├── animated-background.tsx  # Animated gradient background
│   │   ├── page-wrapper.tsx      # Page wrapper with max-width
│   │   ├── empty-state.tsx       # Empty state placeholder
│   │   ├── loading-skeleton.tsx  # Full page loading skeleton
│   │   ├── match-card.tsx        # Match card for schedule
│   │   └── team-detail-card.tsx  # Team detail popover
│   ├── bracket/                  # Bracket-specific components
│   │   ├── bracket-view.tsx      # Main bracket layout (horizontal rounds)
│   │   ├── match-card.tsx        # Match card in bracket (TeamRow A vs B)
│   │   ├── team-tooltip.tsx      # Hover tooltip showing team roster (via portal)
│   │   └── champion-display.tsx  # Trophy/champion display
│   ├── admin/                    # Admin-specific components
│   │   ├── match-editor.tsx      # Modal for editing match scores
│   │   ├── bracket-toolbar.tsx   # Bracket stats + action buttons
│   │   ├── round-scheduler.tsx   # Round scheduling modal
│   │   ├── edit-team-modal.tsx   # Edit team name + players modal
│   │   └── team-list-modal.tsx   # Team list + edit entry point
│   └── public/                   # Public-facing components
│       ├── event-card.tsx        # Event card for listing
│       └── announcement-bar.tsx  # Announcement bar for homepage
├── engine/                       # Tournament bracket engine (pure logic)
│   ├── index.ts                  # Re-exports all engine functions
│   ├── types.ts                  # Engine types (EngineTeam, EngineMatch, etc.)
│   ├── bracket-engine.ts         # Bracket generation, stats, size calculation
│   ├── team-generator.ts         # Auto-generate teams from player list
│   ├── player-parser.ts          # Parse raw player text input
│   ├── seeding.ts                # Seed order generation (random/manual)
│   ├── mapping.ts                # DB <-> Engine type conversion
│   ├── tournament-service.ts     # Save/reset tournament, bracket reconstruction
│   ├── advancement.ts            # Winner advancement, match reset
│   ├── mutations.ts              # Score updates, team swaps
│   ├── validation.ts             # Tournament validation
│   ├── schedule-generator.ts     # Match scheduling
│   ├── history.ts                # Tournament history
│   ├── autosave.ts               # Auto-save logic
│   └── utils.ts                  # ID generation, utilities
├── hooks/                        # React hooks
│   ├── use-tournament.ts         # CENTRAL: tournament state + all actions
│   ├── use-teams.ts              # Read-only team fetching + realtime
│   ├── use-players.ts            # Read-only player fetching + realtime
│   ├── use-brackets.ts           # Bracket fetching
│   ├── use-matches.ts            # Match fetching (filtered)
│   ├── use-settings.ts           # Settings fetching
│   ├── use-events.ts             # Event hooks
│   ├── use-announcements.ts      # Announcement hooks
│   └── use-auth.ts               # Auth hook
├── services/                     # Supabase CRUD operations
│   ├── event-service.ts          # Event CRUD with error handling
│   ├── registration-service.ts   # Form/field/response CRUD + bulk ops
│   ├── announcement-service.ts   # Announcement CRUD
│   └── team-service.ts           # Team update (name, players)
├── lib/
│   ├── types.ts                  # ALL TypeScript types (DB types)
│   ├── utils.ts                  # cn(), formatDate(), etc.
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       └── server.ts             # Server Supabase client
└── middleware.ts                  # Next.js middleware (passthrough)
```

## Database Schema

### Original Tables (v1.0)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `settings` | Platform config (singleton) | tournament_name, tournament_status, best_of, players_per_team, + v0.0.2 fields |
| `teams` | Tournament teams | id, team_name, captain, player_1..player_6, substitute, seed |
| `players` | Individual players | id, username, team_id, position |
| `matches` | Match results | id, team_a/b, team_a_id/b_id, score_a/b, status, round, round_order, winner_id |
| `brackets` | Bracket slots | id, round, round_order, position, team_name, team_seed, match_id |

### v0.0.2 Tables (Community Event Platform)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `events` | Community events | id, title, slug, category, status, registration_status, published, featured |
| `event_categories` | Event categories | id, name, slug, icon, color |
| `registration_forms` | Per-event forms | id, event_id, title, is_active |
| `registration_fields` | Form fields | id, form_id, field_type, label, required, options, sort_order |
| `registration_responses` | Submissions | id, event_id, form_id, respondent_name, respondent_email, data (JSONB), status |
| `announcements` | Platform announcements | id, title, content, type, pinned, published |

### Extended Settings Columns (v0.0.2)

community_name, primary_color, secondary_color, hero_banner, discord_url, kick_url, instagram_url, website_url, version

### RLS Status

All v0.0.2 tables have RLS **disabled**. Auth handled at app level. The original v1.0 tables (settings, teams, players, matches, brackets) have RLS configured via Supabase dashboard.

### Realtime Enabled

- `events` table
- `announcements` table
- `registration_responses` table

## Type System

There are TWO type systems that work together:

### DB Types (`src/lib/types.ts`)
Used for Supabase queries. Flat structure:
```typescript
interface Team {
  id: string;
  team_name: string;
  captain: string;        // name of player_1
  player_1: string;       // flat strings, not objects
  player_2: string;
  player_3: string;
  player_4: string;
  player_5: string;
  player_6: string;
  substitute: string | null;
  seed: number;
}
```

### Engine Types (`src/engine/types.ts`)
Used for bracket logic. Array-based:
```typescript
interface EngineTeam {
  id: string;
  name: string;
  players: EnginePlayer[];   // array of { username, originalIndex }
  seed: number;
  isEliminated: boolean;
}
```

### Mapping Between Them (`src/engine/mapping.ts`)
- `mapTeamToDB(team: EngineTeam)` - engine -> DB format
- `mapTeamFromDB(team: Team)` - DB -> engine format
- `mapMatchToDB(match: EngineMatch)` - engine -> DB format
- `mapMatchFromDB(match: Match)` - DB -> engine format

**IMPORTANT:** Always use mapping functions when converting between DB and engine types. Never manually construct one from the other.

## Tournament State Machine

```
Settings.tournament_status: "upcoming" -> "ongoing" -> "completed"
Mapped to TournamentState:  "draft"/"ready" -> "running" -> "completed"
```

### State Derivation (`deriveTournamentState()` in use-tournament.ts)
- If `tournament_status === "completed"` -> "completed"
- If `tournament_status === "ongoing"` -> check matches
  - All waiting -> "ready"
  - Any live or any finished -> "running"
- If `tournament_status === "upcoming"` -> "draft"

### Match Status Flow
```
waiting -> live -> finished
```
Can also be: `cancelled`

## Key Workflows

### Tournament Generation (5-step wizard)
1. **Paste Players** - Raw text input, parse with `parsePlayers()`
2. **Preview Teams** - Auto-generate teams with `generateTeams()`
3. **Edit Teams** - Rename, reorder, swap, add/delete (in-memory only)
4. **Configure** - Seeding mode, bracket size
5. **Save & Generate** - Delete old data, insert teams/brackets/matches to Supabase

**WARNING:** Step 5 **deletes ALL existing** teams, brackets, and matches before inserting new ones. Never run this during an active tournament.

### Match Score Update
1. Click match in bracket -> `MatchEditor` modal opens
2. Enter scores -> `saveMatchResult()` in tournament-service.ts
3. Updates match record (score_a, score_b, status, winner_id)
4. Advances winner to next round bracket slot
5. Recalculates tournament state

### Team Edit (During Tournament)
1. Admin Bracket -> "Manage Teams" button
2. `TeamListModal` shows all teams with search
3. Click edit -> `EditTeamModal` opens
4. Edit team name, add/remove/reorder players
5. Save -> `updateTeam()` in team-service.ts -> updates `teams` table only
6. Does NOT touch brackets, matches, or tournament state

### Registration System
1. Admin creates event (status: draft)
2. Admin opens Form Builder -> auto-creates form with "Full Name" + "Email" fields
3. Admin adds custom fields (Discord, ML ID, team name, etc.)
4. Admin publishes event (status: registration_open)
5. Public visits `/events/{slug}/register` -> sees form fields from Form Builder
6. Submit -> stored in `registration_responses` table
7. Admin reviews in `/admin/registrations` -> multi-select bulk approve/reject
8. "Copy List" button copies approved participants (answer values only) to clipboard

## Component Patterns

### Dark Theme Cards
```tsx
<Card className="bg-white/[0.035] border-white/[0.06] rounded-[20px]">
  <CardContent className="p-5">
    ...
  </CardContent>
</Card>
```

### Orange Accent Button
```tsx
<Button className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white shadow-[0_2px_12px_rgba(255,122,0,0.3)]">
```

### Status Badges
```tsx
// Pattern: `bg-{color}-500/20 text-{color}-400 border-{color}-500/30`
<div className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium bg-green-500/20 text-green-400 border-green-500/30">
  <Check className="h-3 w-3" /> Approved
</div>
```

### Modal Pattern
```tsx
<motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
  <motion.div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#141416] shadow-2xl">
    {/* header */}
    {/* content */}
    {/* footer with buttons */}
  </motion.div>
</motion.div>
```

### Form Input Styling
```tsx
<Input className="flex h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600" />
```

## Admin Sidebar Structure

```
Dashboard
--- divider ---
Events
Registrations
Announcements
--- divider ---
Tournament Generator  (highlighted orange)
Schedule Generator
Bracket Editor
Schedule Editor
Current Match
Export Data
--- divider ---
Settings
```

Version "v0.0.2" displayed at bottom of sidebar.

## Public Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage (announcements, featured/running/upcoming events) |
| `/events` | Event listing with category tabs |
| `/events/[slug]` | Event detail page |
| `/events/[slug]/register` | Dynamic registration form |
| `/bracket` | Public bracket view |
| `/current-match` | Live current match display |
| `/schedule` | Schedule view |

## Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/login` | Login page |
| `/admin/dashboard` | Dashboard with event overview |
| `/admin/events` | Event management (CRUD) |
| `/admin/events/new` | Create new event |
| `/admin/events/[id]` | Edit event |
| `/admin/events/[id]/form` | Form builder for event |
| `/admin/registrations` | Registration management (multi-select, bulk ops) |
| `/admin/announcements` | Announcement management |
| `/admin/tournament-generator` | 5-step tournament wizard |
| `/admin/schedule-generator` | Schedule wizard |
| `/admin/bracket` | Bracket editor + score editing + team management |
| `/admin/schedule` | Schedule editor |
| `/admin/current-match` | Match controller |
| `/admin/export` | Data export |
| `/admin/settings` | Platform settings |
| `/admin/announce` | Quick announcement |

## Deployment

```bash
# Always build first to check for errors
npm run build

# Commit changes
git add -A
git commit -m "description"
git push origin main

# Deploy to Vercel production
npx vercel --yes --prod
```

## Common Pitfalls

1. **TailwindCSS v4** - No `tailwind.config.js`. Config is in `globals.css` with `@theme` blocks. Do NOT create a tailwind config file.

2. **Type mismatch** - DB types use flat strings (`player_1`, `player_2`), engine types use arrays (`players[]`). Always use `mapTeamToDB()` / `mapTeamFromDB()`.

3. **Tournament generator is destructive** - Running the wizard's save step deletes ALL existing tournament data. Never run during active tournament.

4. **Supabase RLS** - v0.0.2 tables have RLS disabled. v1.0 tables have RLS via Supabase dashboard. Don't re-enable RLS without updating all service functions.

5. **Match status values** - DB stores `waiting`, but engine uses `upcoming`. The mapping converts between them in `mapMatchFromDB()` / `mapMatchToDB()`.

6. **Form Builder fields** - "Full Name" and "Email" are auto-created as default fields when a form is first created. They are regular form fields, not hardcoded.

7. **Registration submission** - The submit handler auto-detects which field is "name" and which is "email" based on `field_type` and label matching.

8. **Bracket reconstruction** - The bracket is reconstructed from `matches` + `teams` tables, NOT from the `brackets` table. The `brackets` table is legacy and should not be relied upon for rendering.

## Git Tags

- `v1.0-stable` - Pre-v0.0.2 checkpoint (original tournament features)
- `v0.0.2` - Community event platform upgrade

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://hrrrjnoawqoikdbvdkeo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## Key Files for Common Tasks

| Task | Files to Edit |
|------|--------------|
| Add new event status | `src/lib/types.ts` (EventStatus), event service, event pages |
| Add new field type | `src/lib/types.ts` (FieldType), form builder page, register page DynamicField |
| Add new admin page | `src/app/admin/{name}/page.tsx`, `src/app/admin/layout.tsx` (sidebar) |
| Add new public page | `src/app/{name}/page.tsx` |
| Modify bracket display | `src/components/bracket/bracket-view.tsx`, `match-card.tsx` |
| Modify tournament logic | `src/engine/` directory (pure functions, no React) |
| Add new DB table | SQL migration in `supabase/migrations/`, types in `src/lib/types.ts`, service in `src/services/` |
| Change theme colors | `src/app/globals.css` (CSS variables + @theme) |
| Modify match scoring | `src/components/admin/match-editor.tsx`, `src/engine/tournament-service.ts` |
