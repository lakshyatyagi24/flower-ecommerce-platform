# Copilot / AI Agent instructions for Flower E‑commerce Platform

Quick orientation
**Important:** Do not run long-running or build commands (e.g. `npm run build`, `npm run start:prod`) unless the user explicitly asks you to — always prefer to run fast, local dev commands only when needed.
- Monorepo with two top-level apps: `flower-backend/` (NestJS + Prisma) and `frontend/` (Next.js + App Router + TypeScript + Tailwind).
- Backend uses Prisma (generator output in `flower-backend/generated/prisma`) and a global `PrismaService` exposed via `src/prisma/prisma.module.ts`.
- Frontend renders the site via `app/layout.tsx` which mounts `Navbar` and `Categories` components — categories currently live in `frontend/src/components/Categories.tsx` and are statically defined.

Primary goals for AI edits
- Implement backend endpoints in Nest under `src/ecommerce/` that expose product/category data (use `PrismaService`).
- Make frontend components (e.g., `Categories`) fetch from the backend API and render dynamically.
- Preserve existing styling/markup in components; prefer adding small hooks or props rather than large rewrites.

Important project-specific details you must follow
- Prisma client location: code expects the generated client at `generated/prisma`. When editing backend code, prefer resolving the Prisma client from `process.cwd()/generated/prisma` or ensure `dist/generated/prisma` exists after build. See `src/prisma/prisma.service.ts` for current resolution logic.
- Nest dev mode (`npm run start:dev`) runs a TypeScript watch; watch may recreate `dist` and remove assets. Prefer adding API logic in `src/` and testing via `start:dev` or `npx ts-node` (dev). When adding build-time assets, use `nest-cli.json` "assets" entry or a postbuild copy script.
- Frontend Next.js app uses App Router. Client components must use "use client"; server components can fetch via server-side code using `fetch` to internal API routes. `Navbar` and `Categories` are client components.

Files and patterns to reference when coding
- Backend
  - `flower-backend/src/prisma/prisma.service.ts` — Prisma service, dynamic loading caveats.
  - `flower-backend/src/ecommerce/` — place new ecommerce controllers/services here (module already present at `ecommerce.module.ts`).
  - `flower-backend/prisma/schema.prisma` — data model (Category, Product, ProductVariant, etc.).
  - `flower-backend/package.json` — scripts: `start`, `start:dev`, `start:prod`, `build`.
- Frontend
  - `frontend/src/app/layout.tsx` — top-level layout mounting `Navbar` and `Categories`.
  - `frontend/src/components/Categories.tsx` — current static categories UI and MegaMenu hook points.
  - `frontend/src/components/SearchBar.tsx` and `SearchResultsClient.tsx` — patterns for client-side state and derived lists.

API conventions and examples
- Create REST endpoints under `/categories` and `/products` using Nest controllers. Return JSON arrays. Example controller method:
  - GET /categories -> returns top-level categories with `children: { id, name, slug }`.
- Use PrismaService injected from `PrismaModule`. Example:
  const categories = await this.prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: 'asc' }, select: { id, name, slug, image, children: { select: { id, name, slug } } } });

Frontend integration approach
- Categories is a client component. Fetch data from backend via a small API helper (e.g., `frontend/src/lib/api.ts`) or call backend URL directly with `fetch('http://localhost:3000/categories')` in client code. Better approach: create a Next internal API route or call the backend server base URL from the client.
- Keep existing Category shape compatible with current `Categories` prop type: { name, slug?, submenus? } — convert backend children into submenu entries for the MegaMenu where appropriate.

Developer workflows (commands)
- Backend
  - Install deps: `cd flower-backend && npm install`
  - Dev (watch): `npm run start:dev` (set PORT via PowerShell: `$env:PORT=3001; npm run start:dev`)
  - Build: `npm run build` (a `postbuild` script may copy generated Prisma client into `dist/generated`)
  - Prod start: `npm run start:prod` (runs `node dist/src/main.js`)
- Frontend
  - Dev: `cd frontend && npm run dev` (Next default at port 3000)

Coding notes for AI agents
- Keep edits minimal and focused. When adding endpoints, register controllers in `ecommerce.module.ts` and import `PrismaModule`.
- Avoid changing global styles or layout unless necessary. Components rely on Tailwind classes widely used across the app.
- When returning data from backend, include minimal fields needed by UI: id, name, slug, image, children[]. Extra metadata is OK but not required.
- For testing locally, run backend on different port if frontend port conflicts: e.g., backend on 3001 (`$env:PORT=3001; npm run start:dev`).

Where to look for further context
- `flower-backend/prisma/schema.prisma` — canonical data model.
- `frontend/src/components/Categories.tsx` — exact markup and event handlers for hover/focus/mouse interactions (important: preserve `onMouseEnter`, `onMouseLeave`, and MegaMenu anchoring logic).
- `flower-backend/src/prisma/prisma.service.ts` — contains rationale about resolving generated prisma client (copy logic / dynamic require).

When you finish a change, run these quick verifications
- Backend: `npm run start:dev` (or build & `npm run start:prod`) and call `GET /categories` to verify JSON payload.
- Frontend: `npm run dev` and verify categories bar populates and MegaMenu opens on hover.

If anything is ambiguous, ask these narrow questions
- Should categories include product counts or only hierarchy? (top-level children only?)
- Do slugs need to be URL-safe mapped or are DB slugs ready for frontend linking?

If you want, I can now:
- Add a simple GET `/categories` endpoint (Nest controller + service) and wire it into `EcommerceModule`.
- Update `frontend/src/components/Categories.tsx` to fetch the backend and render dynamic categories (minimal change preserving current interactions).

---
Please review and tell me whether to (A) add the backend endpoint now, or (B) implement frontend fetching and integrate with existing `Categories` component.
