# Copilot Instructions for AI Agents

## Project Overview

- **Platform**: Full-stack flower e-commerce & event booking, rustic/artisanal themed.
- **Front End**: `apps/frontend` (Next.js, TypeScript, TailwindCSS).
- **Back End**: `apps/backend` (NestJS, TypeScript, PostgreSQL via Prisma).
- **Goals**: Sell bouquets & floral arrangements, capture event bookings (weddings, corporate, parties), manage products & events with seamless, brand-cohesive UX.

---

## Architecture & Major Components

### Frontend (`apps/frontend`)
- **Framework:** Next.js App Router (`src/app/`)
- **Styling:** TailwindCSS (customized, earthy palette), global styles in `src/app/globals.css`
- **State:** Zustand (light state, planned)
- **Auth:** NextAuth.js (JWT)
- **Providers:** Wrap all pages/components with `AuthProvider`, `CartProvider`
- **Modules:** `src/modules/{feature}/` (with `api/`, `components/`, `hooks/`, `types.ts`)
- **UI Components:** `src/components/`
- **Asset Storage:** `src/assets/`, `public/`
- **Routing:** `src/app/{route}/page.tsx`
- **Forms:** React Hook Form (validation, accessibility)
- **Mock Data:** `mock*.ts` used for development

### Backend (`apps/backend`)
- **Framework:** NestJS (TypeScript)
- **API:** REST endpoints: products, orders, bookings, users, event services
- **Auth:** JWT-based
- **ORM:** Prisma with PostgreSQL
- **Admin Panel:** CRUD for products, images, event services, orders, bookings
- **Security:** Input validation, role access, rate limiting, HTTPS, .env for secrets

---

## Developer Workflows


### Frontend Scripts (from package.json)
- **Start Dev Server:** `npm run dev` (Next.js with Turbopack)
- **Build:** `npm run build`
- **Start Production:** `npm run start`
- **Lint:** `npm run lint` (ESLint)
- **Format:** `npm run format` (Prettier, targets `src/**/*.{js,ts,tsx,css,md}`)
- **Prepare Husky:** `npm run prepare` (Git hooks)

### Dependencies
- **Core:** next, react, react-dom
- **UI/UX:** @heroicons/react, react-icons, swiper, tailwind-scrollbar-hide, clsx
- **Avatar:** random-avatar-generator, react-avatar
- **Dev:** prettier, eslint, husky, lint-staged, typescript, @types/*, tailwindcss

### Notes
- All scripts and dependencies are managed in `apps/frontend/package.json`.
- Backend scripts and workflows are not yet implemented (backend folder is empty).

---

## Project-Specific Patterns

- **Providers:** Wrap with `AuthProvider` and `CartProvider`
- **Component Organization:** UI: `src/components/`; Features: `src/modules/{feature}/`
- **Mock Data:** Development only, in `mock*.ts`
- **Routing:** Next.js App Router
- **Styling:** Utility-first via Tailwind, customization for brand vibe in `globals.css`
- **Typography:** Serif for titles, clean sans-serif elsewhere
- **Forms:** React Hook Form with 1px black border for rustic style
- **Testing:** Jest (backend), React Testing Library (frontend) (planned)
- **Documentation:**  
  `README.md` (setup, run commands, ENV vars)  
  Swagger (API docs from NestJS, backend)

---

## Key Files & Directories

- `apps/frontend/src/app/layout.tsx` — App-wide layout/providers
- `apps/frontend/src/components/` — UI components
- `apps/frontend/src/modules/` — Feature modules: auth, cart, products, events
- `apps/frontend/src/app/globals.css` — Global/brand styles
- `apps/frontend/package.json` — Scripts & deps
- `apps/backend/` — NestJS backend (API, auth, admin)
- `prisma/` — Prisma schema, migrations
- `.env` — Environment config (never tracked in git)
- `README.md` — Setup, tips, conventions

---

## Integration Points & Dependencies

- **External:**  
  Next.js, React, TailwindCSS, Zustand, Prisma, NestJS, NextAuth.js, Heroicons, Swiper, Prettier, ESLint, Husky, React Hook Form
- **Internal:**  
  Custom providers, mock APIs/hooks, context modules

---

## Adding New Features (Example)

**Wishlist Feature:**
1. Create: `src/modules/wishlist/`  
   - Add `api/`, `components/`, `hooks/`, `types.ts`
2. Add context/provider if global state needed
3. Update `layout.tsx` if introducing new provider
4. Add development mock data `mockWishlist.ts`
5. Compose new/reusable UI in `src/components/` with Tailwind

---

## FAQ / Troubleshooting

- See `README.md` for architecture, setup, conventions
- Always use `.env` for sensitive data/secrets
- For unclear modules or workflows, reference existing structure or documentation
- Update this file as conventions and stack evolve

---

*Keep this file updated as stack, architecture, and best practices change.*

