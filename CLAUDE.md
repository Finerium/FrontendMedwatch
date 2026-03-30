# CLAUDE.md - MedWatch Premium Frontend

## Project Overview

MedWatch is a Drug Safety Monitoring & Midwife Clinic Management system. This repository is the **premium showcase frontend** -- a fully interactive, glassmorphism-styled web application built to demonstrate MedWatch's capabilities with maximum visual impact. This is NOT a production backend app. All data is dummy/mock. The goal is: make it look and feel as beautiful, polished, and impressive as possible.

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 + custom glassmorphism utilities
- **Components**: shadcn/ui (Radix primitives)
- **Animations**: Framer Motion (page transitions, micro-interactions, scroll reveals)
- **Charts**: Recharts (bar, line, pie, area, sparkline)
- **Map**: react-simple-maps + d3-geo + Indonesia province TopoJSON
- **Network Graph**: react-force-graph-2d (drug interaction visualization)
- **3D**: @react-three/fiber + @react-three/drei (molecule viewer)
- **Command Palette**: cmdk
- **Theme**: next-themes (dark + light mode)
- **Deployment**: Vercel

## Design Direction

### Glassmorphism / Apple-inspired

The entire UI follows a premium glassmorphism aesthetic:

**Dark Mode (primary)**:
- Background: deep dark (#0a0a0f to #0f0f1a gradient)
- Ambient gradient blobs: floating orbs of color behind the UI (purple #7c3aed, blue #3b82f6, teal #06b6d4, pink #ec4899) with large blur radius
- Glass cards: bg-white/[0.05], backdrop-blur-xl, border border-white/[0.08], shadow-[0_8px_32px_0_rgba(0,0,0,0.36)], rounded-2xl
- Text: primary white #f8fafc, secondary #94a3b8
- Accent: blue-500 #3b82f6 primary, purple-500 #8b5cf6 secondary

**Light Mode**:
- Background: soft warm white (#fafaf9 to #f5f5f4 gradient)
- Ambient gradient blobs: soft pastels (lavender, sky blue, rose) with lower opacity
- Glass cards: bg-white/70, backdrop-blur-xl, border border-gray-200/50, shadow-lg, rounded-2xl
- Text: primary slate-900, secondary slate-500
- Accent: same blue-500 and purple-500

### Critical Glass Rules
1. NEVER use solid opaque backgrounds on cards. Always translucent with backdrop-blur
2. ALWAYS have ambient gradient blobs behind the main content area. Without them the glass is invisible
3. Border on glass elements must be semi-transparent white (dark) or semi-transparent gray (light)
4. Shadows should be large and soft, not sharp
5. Rounded corners: minimum rounded-xl, prefer rounded-2xl

### Typography
- Font: Inter (from Google Fonts or next/font)
- Headings: font-semibold or font-bold, tracking-tight
- Body: font-normal, text-sm or text-base
- Numbers/stats: font-mono for tabular data, font-bold for KPI numbers

### Spacing & Layout
- Sidebar: fixed left, 280px wide, glass background, collapsible
- Content area: p-6 or p-8, max-w-7xl
- Card gaps: gap-6
- Section gaps: space-y-8

## Application Pages (12 total)

### Core Pages (from original MedWatch)
1. **Dashboard** (`/`) -- KPI cards with animated counters (count-up on mount), sparkline mini-charts, activity feed with timestamps, quick stats grid
2. **Drug Search** (`/drug-search`) -- search bar with autocomplete dropdown, drug detail card (info, side effects table, top-10 bar chart)
3. **Drug Comparison** (`/drug-comparison`) -- 2-3 drug selector dropdowns, grouped bar chart, comparison summary table
4. **Patient Table** (`/patients`) -- data table with sort, filter, search, pagination, status badges
5. **Patient Form** (`/patients/new`) -- add/edit form with field validation, inline error messages
6. **Visualization** (`/visualization`) -- visit trend line chart + complaint distribution pie chart, date range filter
7. **Safety Checker** (`/safety-checker`) -- drug input, color-coded alert cards (red=danger, yellow=warning, green=safe), animated transitions between states
8. **Export PDF** (`/export`) -- report type selector, date range picker, checkboxes for options, mock preview area, generate button

### New Premium Pages
9. **Indonesia Map** (`/indonesia-map`) -- interactive choropleth map of 34 provinces, hover tooltip (province name, clinic count, patient count), click to zoom, color intensity by patient density, legend
10. **Drug Interaction Network** (`/drug-network`) -- force-directed graph with drug nodes, colored by category, edges = known interactions, drag nodes, zoom/pan, click node for detail popup
11. **3D Molecule Viewer** (`/molecule-viewer`) -- Three.js ball-and-stick model, orbit controls (rotate/zoom), molecule selector dropdown, atom labels on hover, ambient lighting
12. **Side Effect Heatmap** (`/heatmap`) -- matrix grid (drugs x side effects), color intensity = frequency, hover for exact numbers, sortable axes

## Sidebar Navigation

Menu items in order:
1. Dashboard (icon: LayoutDashboard)
2. Drug Search (icon: Search)
3. Drug Comparison (icon: GitCompare)
4. Patients (icon: Users)
5. Visualization (icon: BarChart3)
6. Safety Checker (icon: ShieldCheck)
7. Indonesia Map (icon: Map)
8. Drug Network (icon: Network)
9. Molecule Viewer (icon: Atom)
10. Heatmap (icon: Grid3x3)
11. Export PDF (icon: FileDown)

Bottom of sidebar:
- Theme toggle (Sun/Moon icon with smooth transition)
- Collapse/expand button

Icons: use lucide-react

## Global Features

### Command Palette (Cmd+K / Ctrl+K)
- Opens modal with search input
- Searches across all pages, drugs, patients
- Keyboard navigable
- Use cmdk library + shadcn Command component

### Page Transitions
- Use Framer Motion AnimatePresence
- Fade + slight upward slide on page enter (opacity 0 -> 1, y 20 -> 0)
- Duration: 300ms, ease-out

### Toast Notifications
- Use shadcn Sonner or Toast
- Appear bottom-right
- Auto-dismiss after 3s
- Animated entrance/exit

### Skeleton Loading
- Every page should show skeleton loaders for 800ms on first render (simulated)
- Use shadcn Skeleton component
- Match the shape of actual content

### Scroll Animations
- Cards and sections fade in + slide up when scrolling into view
- Use Framer Motion whileInView
- viewport={{ once: true }}
- Stagger children by 100ms

### Animated Counters
- KPI numbers on Dashboard count up from 0 to target value
- Duration: 1.5s with ease-out
- Trigger on mount / on scroll into view

## Mock Data

All mock data is defined in `docs/MOCK_DATA.md`. Read that file for the complete data structures. Key data files to create:
- `src/data/drugs.ts` -- drug database (20+ drugs)
- `src/data/patients.ts` -- patient records (50+ entries)
- `src/data/interactions.ts` -- drug interaction network (nodes + edges)
- `src/data/indonesia-map.ts` -- province data (34 provinces, clinic/patient counts)
- `src/data/molecules.ts` -- molecule atom/bond definitions (3-5 molecules)
- `src/data/heatmap.ts` -- side effect frequency matrix
- `src/data/activity.ts` -- recent activity feed entries

## File Structure

```
src/
├── app/
│   ├── layout.tsx              <- root layout, providers, sidebar
│   ├── page.tsx                <- Dashboard
│   ├── drug-search/page.tsx
│   ├── drug-comparison/page.tsx
│   ├── patients/
│   │   ├── page.tsx            <- patient table
│   │   └── new/page.tsx        <- patient form
│   ├── visualization/page.tsx
│   ├── safety-checker/page.tsx
│   ├── indonesia-map/page.tsx
│   ├── drug-network/page.tsx
│   ├── molecule-viewer/page.tsx
│   ├── heatmap/page.tsx
│   └── export/page.tsx
├── components/
│   ├── ui/                     <- shadcn components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── AmbientBackground.tsx  <- gradient orbs
│   │   └── PageTransition.tsx
│   ├── dashboard/
│   ├── drugs/
│   ├── patients/
│   ├── charts/
│   ├── map/
│   ├── network/
│   ├── molecule/
│   └── shared/
│       ├── CommandPalette.tsx
│       ├── AnimatedCounter.tsx
│       ├── SkeletonLoader.tsx
│       └── GlassCard.tsx
├── data/                       <- mock data files
├── hooks/                      <- custom hooks
├── lib/
│   └── utils.ts
└── styles/
    └── globals.css             <- Tailwind imports, glass utilities, ambient gradients
```

## Code Conventions

### General
- Use TypeScript strict mode
- Prefer named exports
- Use 'use client' only when needed (interactive components)
- Server components by default
- No `any` types

### Components
- One component per file
- Props interface defined above component
- Destructure props in function signature
- Use cn() utility from lib/utils for conditional classes

### Styling
- Tailwind utility classes only, no custom CSS except globals.css
- Define reusable glass classes as @apply utilities in globals.css
- Color references: always use Tailwind palette (slate, blue, purple, etc.) not hex in components
- Dark mode: use `dark:` variant prefix

### Animations
- Wrap page content in PageTransition component
- Use motion.div for animated elements
- Always respect prefers-reduced-motion
- Keep animations subtle: max 300ms duration, small transforms (20px max translate)

## MCP Servers Available

Claude Code has these MCP servers installed globally:
1. **Playwright** -- use for visual verification, screenshot pages after building
2. **Context7** -- use for fetching latest docs of any library before writing code
3. **shadcn/ui MCP** -- use for listing/installing shadcn components

## Workflow Per Session

```
1. Read this CLAUDE.md
2. Read docs/DESIGN_SYSTEM.md for visual specs
3. Read docs/MOCK_DATA.md for data structures
4. Read the session prompt (pasted in chat)
5. Use Context7 to fetch latest docs for libraries being used
6. Use shadcn MCP to install needed components
7. Ultrathink -> plan component architecture
8. Spawn sub-agents for parallel work
9. Build components with glass styling
10. Use Playwright to screenshot and verify
11. Fix issues, re-screenshot until perfect
```

## Quality Checklist (Before Completing Any Session)

- [ ] All glass cards have backdrop-blur + translucent bg + border
- [ ] Ambient gradient blobs visible behind content
- [ ] Dark mode and light mode both work correctly
- [ ] Page transitions animate on navigation
- [ ] No TypeScript errors
- [ ] No hardcoded colors outside of design tokens
- [ ] Interactive elements have hover/focus states
- [ ] Data renders from mock data files (not inline strings)
- [ ] Responsive: looks good at 1440px and 768px minimum
- [ ] Playwright screenshots taken and verified

## Important Notes

- This is a SHOWCASE project. Prioritize visual beauty over code architecture
- All data is fake/dummy. No real backend, no API calls, no database
- Every interaction should feel smooth and polished
- When in doubt, add more visual polish (gradient borders, glow effects, subtle animations)
- The existing code1.html through code8.html in the project root are layout references from the original mockup. Use them as structural inspiration but the visual design must be completely elevated to premium glassmorphism level
- Deploy target is Vercel (vercel.json not needed for standard Next.js)
