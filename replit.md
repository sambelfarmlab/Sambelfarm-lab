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
- `artifacts/sambelfarm/src/lib/` — auth.tsx (context), config.ts (localStorage), utils.ts
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
- **Brainstorm**: Enter keyword → Claude generates 5 content ideas with hook + angle
- **Generator**: Pick Jenis Konten (Reels/Stories/Feed/Carousel) + Tone → Claude generates full script
- **Editor**: Edit scripts + TRIBE v2 viral analysis (Trigger, Resonance, Impact, Behavior, Engagement). Browse/search Notion scripts. Repurpose format or rewrite with new tone via Claude.
- **Calendar**: Monthly calendar with Notion-backed content schedule, color-coded by status
- **Settings**: AI model, DNA Style, Custom Prompt — saved to localStorage. Notion DB ID managed via `NOTION_DB_ID` Replit Secret (no UI input).

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
