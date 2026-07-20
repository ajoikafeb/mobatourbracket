# ==========================================================
# Neosoul Tournament
# Version : v0.0.3
#
# FEATURE : Prediction Module
# STATUS  : Implementation Plan
# ==========================================================

## Overview

Add a Prediction Module as a **plugin layer** on top of the existing Tournament system. Predictions read from existing match data, never modify tournament tables, and can be enabled/disabled per event.

**Absolute Rules:**
- Zero modifications to tournament engine, bracket, schedule, current match, teams, players, or registration
- Additive-only: new tables, new files, new routes
- When disabled, app behaves exactly as today

---

## Architecture Decisions

### Data Source
- **Single source of truth:** `matches` table (via `useMatches` hook)
- Matches fetched by filtering on the current tournament's matches
- Teams displayed via `teams` table (via `useTeams` hook)

### Prediction per Event
- Each event has its own prediction settings (enable/disable, lock time, leaderboard toggle)
- Leaderboard is **per-event**
- Top Predictor widget on homepage shows the top predictor from the most active event

### Match Display
- **All matches** are shown in the prediction page
- Waiting/Upcoming → Prediction Open (user can pick)
- Live → Prediction Locked (read-only)
- Finished → Prediction Calculated (shows result)
- Cancelled → Prediction Cancelled (greyed out)

---

## Database Schema

### New Migration File
`supabase/migrations/20260720000000_v003_prediction_module.sql`

### Modified Table: `events`
```sql
ALTER TABLE events ADD COLUMN prediction_enabled boolean DEFAULT false;
```

### New Table: `prediction_settings`
```sql
CREATE TABLE prediction_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  enabled boolean DEFAULT false,
  lock_minutes_before integer DEFAULT 5,
  leaderboard_enabled boolean DEFAULT true,
  points_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id)
);
```

### New Table: `prediction_users`
```sql
CREATE TABLE prediction_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_username text NOT NULL UNIQUE,
  total_predictions integer DEFAULT 0,
  correct_predictions integer DEFAULT 0,
  wrong_predictions integer DEFAULT 0,
  points integer DEFAULT 0,
  accuracy numeric(5,2) DEFAULT 0,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### New Table: `prediction_entries`
```sql
CREATE TABLE prediction_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  discord_username text NOT NULL REFERENCES prediction_users(discord_username) ON DELETE CASCADE,
  selected_team_id uuid NOT NULL,
  is_correct boolean,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, discord_username)
);
```

### Database Functions

**`recalculate_user_stats(p_discord_username text)`**
- Counts correct/wrong predictions for the user
- Calculates points (correct * 1)
- Calculates accuracy (correct / total * 100)
- Calculates current_streak and best_streak
- Updates `prediction_users` row

**Trigger: `trg_prediction_result_calculated`**
- On UPDATE of `prediction_entries.is_correct`
- Calls `recalculate_user_stats()` for the affected user

### Realtime
Enable Supabase Realtime on: `prediction_entries`, `prediction_users`

---

## New Files

### 1. Type Definitions
**`src/lib/prediction-types.ts`**

```typescript
export interface PredictionSettings {
  id: string;
  event_id: string;
  enabled: boolean;
  lock_minutes_before: number;
  leaderboard_enabled: boolean;
  points_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PredictionUser {
  id: string;
  discord_username: string;
  total_predictions: number;
  correct_predictions: number;
  wrong_predictions: number;
  points: number;
  accuracy: number;
  current_streak: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
}

export interface PredictionEntry {
  id: string;
  match_id: string;
  event_id: string;
  discord_username: string;
  selected_team_id: string;
  is_correct: boolean | null;
  submitted_at: string;
  created_at: string;
}

// Derived types (not stored in DB)
export interface PredictableMatch {
  match: Match;           // from @/lib/types
  teamA: Team | null;     // from @/lib/types
  teamB: Team | null;     // from @/lib/types
  predictionStatus: "open" | "locked" | "calculated" | "cancelled";
  userPrediction: PredictionEntry | null;
}

export interface LeaderboardEntry {
  rank: number;
  discord_username: string;
  points: number;
  accuracy: number;
  correct_predictions: number;
  wrong_predictions: number;
  current_streak: number;
  best_streak: number;
}

export type PredictionStatus = "open" | "locked" | "calculated" | "cancelled";
```

### 2. Service Layer
**`src/services/prediction-service.ts`**

Functions:
- `getPredictionSettings(eventId: string): Promise<PredictionSettings | null>`
- `upsertPredictionSettings(eventId: string, settings: Partial<PredictionSettings>): Promise<PredictionSettings>`
- `getPredictionEntries(eventId: string, username?: string): Promise<PredictionEntry[]>`
- `upsertPredictionEntry(entry: Omit<PredictionEntry, "id" | "is_correct" | "created_at">): Promise<PredictionEntry>`
- `deletePredictionEntry(matchId: string, username: string): Promise<void>`
- `bulkUpsertPredictions(entries: Array<...>): Promise<PredictionEntry[]>`
- `getOrCreatePredictionUser(username: string): Promise<PredictionUser>`
- `getLeaderboard(eventId: string): Promise<LeaderboardEntry[]>`
- `recalculateUserStats(username: string): Promise<void>`
- `recalculateAllUserStats(eventId: string): Promise<void>`
- `exportPredictionsCSV(eventId: string): Promise<string>`
- `resetPredictions(eventId: string): Promise<void>`

### 3. React Hooks
**`src/hooks/use-predictions.ts`**

```typescript
// Realtime-enabled hooks (subscribe to prediction_entries + prediction_users)
usePredictionSettings(eventId: string) → { settings, loading }
usePredictionEntries(eventId: string, username?: string) → { entries, loading, refetch }
useLeaderboard(eventId: string) → { leaderboard, loading }
useTopPredictor() → { topPredictor, loading }  // global: highest points from most active event
usePredictableMatches(eventId: string) → { matches, loading }  // all matches + team data + prediction status
```

### 4. Public Prediction Page
**`src/app/events/[slug]/predict/page.tsx`**

Route: `/events/[slug]/predict`

Layout:
```
┌─────────────────────────────────────────────────┐
│ Navbar                                          │
├─────────────────────────────────────────────────┤
│ ← Back to Event                                 │
│                                                 │
│ [Discord Username Input]  ← First visit prompt  │
│ "Enter your Discord username to start predicting"│
│ [Save]                                          │
│                                                 │
│ ┌─ Match Card 1 ──────────────────────────────┐ │
│ │ Round: Quarter Final                        │ │
│ │ Team A  [Select] VS [Select]  Team B        │ │
│ │ Match Time: 20 Jul 2026, 19:00              │ │
│ │ Status: Open / Locked / Calculated          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Match Card 2 ──────────────────────────────┐ │
│ │ ...                                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Save All Predictions]  ← Submit all at once    │
│                                                 │
│ ┌─ Leaderboard ───────────────────────────────┐ │
│ │ #1  PlayerName  12pts  80%  10/2           │ │
│ │ #2  PlayerName  8pts   60%  6/4            │ │
│ │ ...                                        │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Footer                                          │
└─────────────────────────────────────────────────┘
```

Features:
- First visit: prompt for Discord username, save to `localStorage("prediction_username")`
- Show all matches with round, team names, time, status
- Open matches: click team to select prediction (highlighted border)
- Locked/finished matches: read-only, show prediction if exists
- "Save All Predictions" button: bulk upsert all pending predictions
- Leaderboard section at bottom (if leaderboard_enabled)
- Toast feedback on save success/error

### 5. Prediction Match Card Component
**`src/components/public/prediction-card.tsx`**

Props: `{ match: PredictableMatch; prediction: PredictionEntry | null; onSelect: (matchId: string, teamId: string) => void; disabled: boolean }`

Renders:
- Round name badge
- Team A card (clickable if open, with selected state)
- VS divider
- Team B card (clickable if open, with selected state)
- Match time
- Status indicator (Open/Locked/Calculated/Cancelled)
- If calculated: shows correct/wrong badge

### 6. Leaderboard Component
**`src/components/public/leaderboard.tsx`**

Props: `{ leaderboard: LeaderboardEntry[]; highlight?: string }`

Renders:
- Table with rank, username, points, accuracy, correct/wrong, streak
- Top 3 with special styling (gold/silver/bronze)
- Highlight the current user's row if `highlight` matches

### 7. Top Predictor Widget
**`src/components/public/top-predictor.tsx`**

Props: `{ topPredictors: LeaderboardEntry[] }`

Renders:
- Card with "Top Predictors" header
- Top 3 with avatar-like rank badges, username, points, accuracy
- Used on homepage

### 8. Admin Prediction Management
**`src/app/admin/predictions/page.tsx`**

Layout:
```
┌─────────────────────────────────────────────────┐
│ ← Back to Dashboard                             │
│ Prediction Management               [Export CSV] │
│ Manage predictions across all events             │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─ Event Card ────────────────────────────────┐ │
│ │ Event Title                                 │ │
│ │ Category | Status                           │ │
│ │ Prediction: Enabled ✓ / Disabled ✗         │ │
│ │ [Toggle] [View Leaderboard] [Reset]         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Event Card 2 ──────────────────────────────┐ │
│ │ ...                                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Prediction Settings (per-event modal/inline)┐ │
│ │ Enable/Disable                              │ │
│ │ Lock Time: [5] minutes before match         │ │
│ │ Leaderboard: [Enabled/Disabled]             │ │
│ │ Point System: [Enabled/Disabled]            │ │
│ │ [Save]                                      │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Features:
- List all events with prediction status
- Toggle prediction on/off per event
- Configure lock time, leaderboard, point system per event
- View leaderboard for specific event
- Export predictions as CSV
- Reset predictions (with confirmation)

### 9. Admin Leaderboard Page
**`src/app/admin/predictions/leaderboard/page.tsx`**

Route: `/admin/predictions/leaderboard?event=<event_id>`

Shows full leaderboard for a specific event with:
- All participants ranked
- Points, accuracy, correct/wrong, streaks
- Export button
- Realtime updates

---

## Modified Files

### 1. `src/lib/types.ts`
**Change:** Add `prediction_enabled` to `Event` interface

```typescript
interface Event {
  // ... existing fields ...
  prediction_enabled: boolean;  // ADD THIS
}
```

### 2. `src/components/shared/navbar.tsx`
**Change:** Add conditional "Predictions" nav item

```typescript
// Add to navLinks array (conditionally):
// Only show if any event has prediction_enabled === true
// OR if settings allow it globally

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bracket", label: "Bracket", icon: Swords },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/current-match", label: "Live", icon: Radio },
  { href: "/events", label: "Events", icon: Trophy },
  // CONDITIONAL: Add Predictions link
  // Show when at least one event has prediction_enabled
];
```

Implementation approach:
- Fetch events via `useEvents()` hook
- Filter for events with `prediction_enabled === true`
- If any exist, show the "Predictions" nav item
- Link to `/events` (filtered to show events with predictions)

### 3. `src/app/events/[slug]/page.tsx`
**Change:** Add "Make Predictions" CTA card (similar to Registration CTA)

After the Registration CTA section, add:
```tsx
{/* Prediction CTA */}
{event.prediction_enabled && (event.status === "running" || event.status === "upcoming") && (
  <motion.div variants={fadeUp} custom={5.5} className="mb-8">
    <Card className="p-6 border-purple-500/20 bg-purple-500/[0.03]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white mb-1">
            Make Your Predictions
          </h3>
          <p className="text-sm text-zinc-400">
            Predict match winners and climb the leaderboard
          </p>
        </div>
        <Link href={`/events/${event.slug}/predict`}>
          <Button size="lg" variant="outline" className="gap-2 shrink-0 border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
            <Target className="h-4 w-4" />
            Predict Now
          </Button>
        </Link>
      </div>
    </Card>
  </motion.div>
)}
```

### 4. `src/app/page.tsx` (Homepage)
**Change:** Add "Top Predictors" section between Upcoming Events and Championship Arena

```tsx
{/* ── Top Predictors ──────────────────────────────── */}
<TopPredictorSection />

{/* Component renders: */}
{topPredictors.length > 0 && (
  <section>
    <h2>Top Predictors</h2>
    <TopPredictor topPredictors={topPredictors} />
  </section>
)}
```

### 5. `src/components/public/event-card.tsx`
**Change:** Add prediction badge when `prediction_enabled` is true

```tsx
{/* Add in the bottom badges area: */}
{event.prediction_enabled && (
  <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-medium text-purple-400 backdrop-blur-sm">
    <Target className="h-2.5 w-2.5" />
    Predict
  </span>
)}
```

### 6. `src/app/admin/layout.tsx`
**Change:** Add sidebar navigation item for Predictions

```typescript
// Add after the Export Data link, before the divider:
{ type: "link", href: "/admin/predictions", label: "Predictions", icon: Target },
```

### 7. `src/app/admin/events/[id]/page.tsx`
**Change:** Add prediction settings toggle in event edit page

Add a "Prediction" section card:
- Toggle switch for `prediction_enabled`
- Link to configure detailed prediction settings

---

## File Summary

### New Files (10)
| File | Description |
|------|-------------|
| `src/lib/prediction-types.ts` | TypeScript interfaces for prediction module |
| `src/services/prediction-service.ts` | CRUD + business logic for predictions |
| `src/hooks/use-predictions.ts` | React hooks with Realtime subscriptions |
| `src/app/events/[slug]/predict/page.tsx` | Public prediction page (matches + submit) |
| `src/components/public/prediction-card.tsx` | Match prediction card component |
| `src/components/public/leaderboard.tsx` | Leaderboard display component |
| `src/components/public/top-predictor.tsx` | Top predictor widget (homepage) |
| `src/app/admin/predictions/page.tsx` | Admin prediction management |
| `src/app/admin/predictions/leaderboard/page.tsx` | Admin leaderboard view |
| `supabase/migrations/20260720000000_v003_prediction_module.sql` | Database migration |

### Modified Files (7)
| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `prediction_enabled` to Event interface |
| `src/components/shared/navbar.tsx` | Add conditional Predictions nav item |
| `src/app/events/[slug]/page.tsx` | Add Predict CTA card |
| `src/app/page.tsx` | Add Top Predictor section |
| `src/components/public/event-card.tsx` | Add prediction badge |
| `src/app/admin/layout.tsx` | Add sidebar nav item |
| `src/app/admin/events/[id]/page.tsx` | Add prediction toggle |

---

## Implementation Order

### Phase 1: Foundation (Database + Types + Service)
1. Create migration SQL file
2. Create `prediction-types.ts`
3. Create `prediction-service.ts`
4. Add `prediction_enabled` to Event type

### Phase 2: Hooks + Realtime
5. Create `use-predictions.ts` hooks
6. Test Realtime subscriptions

### Phase 3: Public Pages
7. Create `prediction-card.tsx` component
8. Create `leaderboard.tsx` component
9. Create `top-predictor.tsx` component
10. Create `/events/[slug]/predict/page.tsx`
11. Add Predict CTA to event detail page

### Phase 4: Homepage Integration
12. Add Top Predictor section to homepage
13. Add prediction badge to event cards
14. Add conditional nav item to navbar

### Phase 5: Admin Panel
15. Add sidebar nav item to admin layout
16. Create `/admin/predictions/page.tsx`
17. Create `/admin/predictions/leaderboard/page.tsx`
18. Add prediction toggle to event edit page

### Phase 6: Polish + Export
19. CSV export functionality
20. Reset predictions with confirmation
21. Edge case handling (no matches, no predictions yet, etc.)
22. Loading states and empty states

---

## Safety Checklist

- [ ] No modifications to `src/engine/` directory
- [ ] No modifications to `src/engine/tournament-service.ts`
- [ ] No modifications to bracket/schedule generators
- [ ] No modifications to current match pages
- [ ] No modifications to team/player data
- [ ] No modifications to registration system
- [ ] No modifications to existing database tables (except adding one column to `events`)
- [ ] Prediction reads matches via `useMatches` hook (no direct tournament data access)
- [ ] When prediction_enabled = false, no UI changes visible
- [ ] Existing tournaments continue operating normally
- [ ] Existing schedules remain untouched
- [ ] Existing brackets remain untouched
