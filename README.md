# Neosoul Tournament Tracker

> Community event platform for Indonesian Mobile Legends tournaments — bracket tracking, event management, registration system, and live match display.

**Live:** [neosoulid.vercel.app](https://neosoulid.vercel.app)
**GitHub:** [ajoikafeb/mobatourbracket](https://github.com/ajoikafeb/mobatourbracket)

---

## Features

### Tournament System
- **5-Step Tournament Generator** — paste player list, auto-generate teams, edit/reorder, configure seeding, generate bracket
- **Interactive Bracket Editor** — click matches to edit scores, set winners, auto-advance to next round
- **Live Match Display** — real-time current match screen for event streaming
- **Schedule Generator** — auto-space matches with configurable duration and breaks
- **Team Management** — edit team names and roster during a running tournament without breaking data
- **Champion Display** — animated trophy display when tournament completes

### Community Event Platform (v0.0.2)
- **Event Management** — create, edit, publish, feature, duplicate, and delete events with category support
- **Dynamic Registration Forms** — per-event form builder with 15+ field types (text, email, dropdown, checkbox, file upload, Discord, ML ID, etc.)
- **Registration Management** — multi-select bulk approve/reject, search/filter by event and status
- **Copy Participant List** — one-click copy approved participants to clipboard
- **Announcements** — pinned/unpinned, publish/archive, types (info, warning, success, event, update)
- **Public Event Pages** — event listing with category tabs, event detail, dynamic registration forms

### Platform
- **Admin Dashboard** — event overview, pending registrations count, quick actions
- **Settings** — tournament branding, social links (Discord, Kick, Instagram, website), community info
- **Data Export** — CSV export for registrations and tournament data
- **Responsive Design** — works on desktop, tablet, and mobile
- **Dark Theme** — consistent dark UI with orange accent (#FF7A00)
- **Real-time Updates** — Supabase Realtime for events, announcements, and registrations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.10 (App Router) |
| Language | TypeScript ^5 |
| UI | React 19.2.4 |
| Styling | TailwindCSS v4 |
| Animation | Framer Motion ^12.42.2 |
| Icons | Lucide React ^1.240 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account (for database)

### Installation

```bash
git clone https://github.com/ajoikafeb/mobatourbracket.git
cd mobatourbracket
npm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

## Database Setup

### Original Tables (v1.0)

The following tables are created via Supabase dashboard (RLS enabled):

| Table | Purpose |
|-------|---------|
| `settings` | Platform config (singleton row) |
| `teams` | Tournament teams with players |
| `players` | Individual players |
| `matches` | Match results with scores |
| `brackets` | Bracket slots (legacy, not used for rendering) |

### v0.0.2 Tables

Run the migration in Supabase SQL Editor:

```sql
-- See: supabase/migrations/20260717000000_v002_event_platform.sql
```

| Table | Purpose |
|-------|---------|
| `events` | Community events |
| `event_categories` | Event categories (8 default) |
| `registration_forms` | Per-event registration forms |
| `registration_fields` | Form field definitions |
| `registration_responses` | Form submissions |
| `announcements` | Platform announcements |

**Note:** v0.0.2 tables have RLS disabled. Auth is handled at the application level.

### Settings Table Extensions

```sql
ALTER TABLE settings ADD COLUMN community_name TEXT DEFAULT 'Neosoul Indonesia';
ALTER TABLE settings ADD COLUMN primary_color TEXT DEFAULT '#FF7A00';
ALTER TABLE settings ADD COLUMN secondary_color TEXT DEFAULT '#FFA726';
ALTER TABLE settings ADD COLUMN hero_banner TEXT;
ALTER TABLE settings ADD COLUMN discord_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN kick_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN instagram_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN website_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN version TEXT DEFAULT 'v0.0.2';
```

## Project Structure

```
src/
├── app/                    # Pages (Next.js App Router)
│   ├── admin/              # Admin panel pages
│   ├── events/             # Public event pages
│   ├── bracket/            # Public bracket view
│   ├── current-match/      # Live match display
│   └── schedule/           # Schedule view
├── components/             # React components
│   ├── ui/                 # Base UI (button, card, input, etc.)
│   ├── shared/             # Shared (navbar, footer, etc.)
│   ├── bracket/            # Bracket-specific
│   ├── admin/              # Admin modals
│   └── public/             # Public components
├── engine/                 # Tournament bracket engine (pure logic)
├── hooks/                  # React hooks (use-tournament, use-teams, etc.)
├── services/               # Supabase CRUD operations
└── lib/                    # Types, utils, Supabase client
```

## Admin Panel

Access at `/admin/login`. The admin sidebar includes:

| Section | Description |
|---------|-------------|
| Dashboard | Overview with stats and quick actions |
| Events | Create, edit, publish, feature events |
| Registrations | Multi-select bulk approve/reject, copy list |
| Announcements | Create, pin, publish announcements |
| Tournament Generator | 5-step wizard to create tournaments |
| Bracket Editor | Edit scores, manage teams, view bracket |
| Schedule Editor | Edit match schedules |
| Current Match | Control live match display |
| Settings | Branding, social links, community info |

## Public Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with announcements and events |
| `/events` | Event listing with category tabs |
| `/events/[slug]` | Event detail page |
| `/events/[slug]/register` | Dynamic registration form |
| `/bracket` | Public bracket view |
| `/current-match` | Live match display |
| `/schedule` | Schedule view |

## Design System

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#09090B` | Main background |
| Primary | `#FF7A00` | Brand orange, CTAs |
| Secondary | `#FFA726` | Secondary actions |
| Card | `rgba(255,255,255,0.035)` | Card backgrounds |
| Border | `rgba(255,255,255,0.06)` | Card borders |
| Text | `white` -> `zinc-600` | Text hierarchy |

### Status Colors

| Status | Color |
|--------|-------|
| Success/Approved | Green (`#22C55E`) |
| Warning/Pending | Yellow (`#EAB308`) |
| Error/Rejected | Red (`#EF4444`) |
| Info/Live | Blue (`#3B82F6`) / Orange (`#FF7A00`) |
| Inactive | Zinc (`#71717A`) |

### Component Patterns

- **Cards:** `bg-white/[0.035]` with `border-white/[0.06]` and `rounded-[20px]`
- **Buttons:** Orange primary, outline for secondary, ghost for tertiary
- **Modals:** Centered with backdrop blur, `bg-[#141416]` body
- **Inputs:** Rounded-xl, subtle border, dark background
- **Badges:** Colored backgrounds with 20% opacity

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
npx vercel --yes --prod
```

### Manual Build

```bash
npm run build
# Upload .next/ folder to your hosting provider
```

## Version History

### v0.0.2 (Current)
- Community event platform
- Dynamic registration forms
- Multi-select bulk operations
- Copy participant list
- Team editing during tournament
- Announcements system
- Enhanced admin dashboard

### v1.0-stable
- Original tournament features
- Bracket generation and editing
- Schedule management
- Live match display

## License

Private project — Neosoul Indonesia.

## Support

For issues, contact the development team or open an issue on GitHub.
