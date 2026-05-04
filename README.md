# MedWatch Frontend

Next.js 16 + TypeScript + Tailwind v4 frontend for the MedWatch system. Wired to the Flask backend at GCP Cloud Run via Vercel API proxy.

- **Live:** https://medwatch-frontend.vercel.app
- **Backend API:** https://medwatch-api-517694123086.asia-southeast1.run.app
- **Backend repo:** https://github.com/Bisura16/medWatch

## Tech stack

- Next.js 16.2 (App Router, Turbopack)
- React 19.2
- TypeScript strict
- Tailwind CSS v4
- shadcn/ui (Radix-based) + Base UI
- Recharts 3.8 (visualizations)
- Framer Motion 12 (animations)
- Zustand 5 (state)
- next-themes (dark/light)
- Three.js + React Three Fiber (archived molecule viewer)
- react-force-graph-2d (archived drug network)
- react-simple-maps + topojson (archived Indonesia map)

## Routes

| Route | Role | Purpose |
|---|---|---|
| `/login` | public | 3-tab login (tenaga_kesehatan, masyarakat, admin) with demo creds |
| `/` | tenaga_kesehatan, admin | Dashboard |
| `/patients` | tenaga_kesehatan, admin | Patient list (SOAP) |
| `/patients/new` | tenaga_kesehatan, admin | Bidan-style patient form |
| `/patients/[id]` | own + tenaga_kesehatan, admin | Detail view (printable) |
| `/drug-search` | any auth | Drug catalog search |
| `/drug-comparison` | any auth | Side-by-side comparison |
| `/safety-checker` | any auth | Multi-drug safety analysis |
| `/visualization` | tenaga_kesehatan, admin | 3 chart views from API |
| `/heatmap` | any auth | Drug x effect heatmap |
| `/export` | tenaga_kesehatan, admin | PDF generation |
| `/admin/dashboard` | admin | System overview |
| `/admin/scraper` | admin | Trigger drug scraper (mocked) |
| `/admin/users` | admin | Manage user accounts |
| `/pasien/profile` | masyarakat | Self-service profile |
| `/_archived/*` | none | Archived original showcase pages (molecule-viewer, drug-network, indonesia-map) |

## Architecture

The frontend never talks to Cloud Run directly. All `/api/...` calls route through `src/app/api/[...slug]/route.ts` which is a Vercel proxy that:

1. Forwards the request to `BACKEND_API_URL` (server-only env var, never exposed to browser)
2. Attaches the JWT from `medwatch_token` httpOnly cookie as `Authorization: Bearer ...`
3. On `/api/auth/login`, sets the cookie from the backend's `token` response field
4. On `/api/auth/logout`, clears the cookie

Auth middleware at `src/middleware.ts` redirects unauthenticated users to `/login` and enforces role-based access on `/admin/*` and `/pasien/*` paths.

## Demo credentials

Click any tab on `/login` to see the demo accounts for that role. Quick reference:

| Role | Username | Password |
|---|---|---|
| Admin | `admin_ghaisan` | `admin2026` |
| Tenaga Kesehatan | `bidan_siti` | `siti2026` |
| Masyarakat | `umum_budi` | `budi2026` |

## Quick start (local dev)

```bash
npm install

# Point to local backend (recommended for development)
echo "BACKEND_API_URL=http://localhost:8080" > .env.local
npm run dev

# OR point to live Cloud Run backend
echo "BACKEND_API_URL=https://medwatch-api-517694123086.asia-southeast1.run.app" > .env.local
npm run dev
```

Visit http://localhost:3000.

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `BACKEND_API_URL` | yes (server-side) | Backend Cloud Run URL. Never exposed to browser. |

## Deploy

```bash
vercel --prod
```

(Already wired via `.vercel/project.json` to `Finerium/medwatch-frontend`.)

## Patient SOAP schema

The Patient type matches Bimo's canonical SOAP shape from `anggota2/pasien_helper.py`:

```typescript
type Patient = {
  id: string;                  // P001 format
  tanggal_kunjungan?: string;  // DD-MM-YYYY
  nama: string;                // required
  umur?: string;
  alamat?: string;
  kategori?: string;           // Ibu Hamil, KB, Anak, Imunisasi, Umum, ...
  S: { keluhan: string; riwayat?: string };
  O: {
    tekanan_darah?: string;
    nadi?: string;
    suhu_c?: string;
    respirasi?: string;
    bb_kg?: string;
    tb_cm?: string;
    lila_cm?: string;
    catatan?: string;
  };
  A: { diagnosa: string };
  P: { tindakan: string; resep?: string; jadwal_kontrol?: string };
};
```

Detail view renders this in bidan-style format using `composeO()` helper from `src/lib/patient-format.ts`. Empty O fields are skipped, abbreviations match real bidan handwritten records (`td.`, `BB`, `tb`, `lila`, etc.).

## Project structure

```
src/
├── app/
│   ├── api/[...slug]/route.ts       # Vercel proxy to Cloud Run
│   ├── login/page.tsx                # Multi-role login page
│   ├── admin/                        # Admin-only pages
│   ├── pasien/                       # Masyarakat-only pages
│   ├── patients/                     # SOAP CRUD
│   ├── _archived/                    # Three pages no longer wired
│   └── ...                           # Other clinical pages
├── components/layout/
│   ├── ClientShell.tsx
│   ├── Sidebar.tsx                   # Role-conditional nav
│   ├── TopBar.tsx
│   └── ...
├── lib/
│   ├── api.ts                        # fetch wrapper
│   ├── auth-store.ts                 # Zustand auth store
│   ├── store.ts                      # Zustand patient store (API-backed)
│   ├── patient-format.ts             # SOAP type + composeO helper
│   ├── safety-checker.ts             # API wrapper
│   ├── pdf-generator.ts              # API wrapper (downloads blob)
│   └── ...
└── middleware.ts                     # Auth + role gating
```

## Authorship

Frontend authored by Ghaisan Khoirul Badruzaman as part of the MedWatch integration. The integrated state lives on branch `ghaisan-APIIntegration`. The original showcase commit history (premium glassmorphism showcase, localStorage features) is preserved.
