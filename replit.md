# Sambelfarm Content Lab

An AI-powered content creation tool for SambelFarm — brainstorm ideas, generate scripts, analyze viral potential with TRIBE v2, and sync everything to Notion.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxy at /api)
- `pnpm --filter @workspace/sambelfarm run dev` — run the frontend (Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- Required env: `SESSION_SECRET`, `ADMIN_PASSWORD`, `NOTION_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Tailwind CSS v4, shadcn/ui, wouter (routing), TanStack Query
- API: Express 5 (port 8080 → proxy path `/api`)
- AI: Claude via Anthropic SDK (`@workspace/integrations-anthropic-ai`)
- Notion: native fetch calls to Notion API v1
- Auth: HMAC-SHA256(SESSION_SECRET, ADMIN_PASSWORD) — stateless token stored in localStorage
- Codegen: Orval from OpenAPI spec → React Query hooks + Zod schemas

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all routes)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — Generated Zod schemas (used server-side)
- `artifacts/api-server/src/routes/` — auth.ts, claude.ts, notion.ts, health.ts
- `artifacts/sambelfarm/src/pages/` — login, home, brainstorm, generator, editor, calendar, settings
- `artifacts/sambelfarm/src/lib/` — auth.tsx (context), config.ts (localStorage), draft.tsx (shared workflow state), utils.ts
- `artifacts/sambelfarm/src/components/layout.tsx` — bottom nav bar layout

## Architecture decisions

- **Stateless HMAC auth**: token = HMAC-SHA256(SESSION_SECRET, ADMIN_PASSWORD). No DB or session store needed.
- **Auth token via `setAuthTokenGetter`**: registered on app mount in AuthProvider, auto-injects `Authorization: Bearer` header on every API call via `customFetch`.
- **Notion proxied server-side**: NOTION_API_KEY never exposed to browser; all Notion calls go through `/api/notion/*`.
- **Config in localStorage**: DNA style, custom prompt, AI model choice stored as `sf_config` JSON. Notion DB ID is NOT stored client-side — read exclusively from `NOTION_DB_ID` server secret.
- **Claude model selectable**: 4 models exposed in Settings; all routes validate against allowlist.

## Product

- **Login**: Password-based auth (HMAC token)
- **Home**: Dashboard with recent scripts from Notion + quick nav
- **[WORKFLOW 1] Brainstorm → Generator**: Enter keyword → 5 clickable ideas (judul/hook/angle). Click an idea → auto-fill Generator form (Topik, Judul, Konsep/POV, Platform, Jenis Konten, Tone, Input Tambahan). "Generate Script" → Claude generates script → auto-navigate to Editor.
- **[WORKFLOW 2] Editor**: Full form (all detail fields + Tanggal), script textarea. "Analisis TRIBE" → Claude scores T/R/I/B/E (0-100), Skor Viralitas, Analisis AI, Rekomendasi, Caption TikTok/Instagram/YT Shorts. "Simpan" → POST to Notion (all 13 properties) → added to local list → form reset.
- **[WORKFLOW 3] Script Tersimpan** (tab in Editor): List of saved scripts. "Adaptasi Script" → AI adapts for new platform/jenis → back to Editor. "Tulis Ulang" → AI rewrites with new tone → back to Editor.
- **Settings**: AI model, DNA Style, Custom Prompt — saved to localStorage.
- **Calendar**: Monthly view (Notion-backed). De-prioritized for now.

## User preferences

- Language: Indonesian UI (Bahasa Indonesia)
- Brand: Sage #7D9D85 (primary), Terra #E2725B (accent), Gold #C9A96E, Font: Plus Jakarta Sans
- Light mode only, no dark mode

## Gotchas

- Always run codegen after changing `lib/api-spec/openapi.yaml`
- The `sorts` param in Notion query uses timestamp OR property format — cast as `unknown` in TypeScript
- Frontend uses `import.meta.env.BASE_URL` for wouter base path (set by Vite artifact config)
- `setAuthTokenGetter` must be called before any API hook runs — done in AuthProvider useEffect

## Pointers

- See the `pnpm-workspace` skill for workspace structure and TypeScript setup
- Notion API docs: https://developers.notion.com/reference
