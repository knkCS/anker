# Dashboard Subpath Export — decoupling react-grid-layout (fixes #147)

**Date:** 2026-07-05
**Status:** Approved design
**Ships as:** anker **3.0.0** (breaking: dashboard exports leave `/components`)

## Problem

`react-grid-layout` is declared an optional peer, but
`src/components/dashboard/dashboard.tsx` imports it statically and the
`/components` barrel re-exports the dashboard module — so every consumer
of `@knkcs/anker/components` (all knkCMS services via fieldkit's table,
etc.) fails module resolution unless it installs a grid library it never
uses. fieldkit carries a devDependency workaround today (issue #147).

## Decision

**New `@knkcs/anker/dashboard` subpath; dashboard leaves `/components`.**
The module graph then enforces what the optional-peer declaration only
promised: only `/dashboard` importers resolve `react-grid-layout`.

Rejected:
- *Lazy `import()` in Dashboard* (the issue's original suggestion):
  bundlers (Vite/Rollup) resolve dynamic imports at build time, so
  consumers without the package still fail their builds — the footgun
  moves into per-consumer bundler config. Plus Suspense/loading states
  for no benefit.
- *Hard dependency*: bundle + install cost for every non-dashboard
  consumer.

## Changes — anker

1. **Move `src/components/dashboard/` → `src/dashboard/`** (subpath =
   top-level directory, matching theme/primitives/components/atoms/
   forms/feedback/templates/navigation). Fix the module's relative
   imports (`../../atoms/...` etc.), test/story imports move with it.
2. `src/dashboard/index.ts` is the new entry; `src/components/index.ts`
   drops both dashboard export blocks (values and types).
3. `package.json`: exports map gains `"./dashboard"` (types/import/
   default → `dist/dashboard/index.*`); tsup config gains the entry;
   version → `3.0.0`. `react-grid-layout` stays an optional peer.
4. **Regression pin:** a build-output check (in the existing verify/CI
   step) asserting no `react-grid-layout` reference appears in
   `dist/components/`, `dist/atoms/`, `dist/primitives/`, `dist/forms/`,
   `dist/feedback/`, `dist/templates/`, `dist/navigation/`, `dist/theme/`
   — only `dist/dashboard/` may reference it.
5. Docs: `CLAUDE-ANKER.md` Dashboard section — import path becomes
   `@knkcs/anker/dashboard`; add "install `react-grid-layout` only if
   you import `/dashboard`". Changelog 3.0.0 entry with the migration
   line. `docs/page-patterns.md` references updated if they name the
   import path.

## Changes — mediahub (only known Dashboard consumer)

- `web/package.json`: `@knkcs/anker` `^2.11.0` → `^3.0.0`.
- ~9 files in `web/src/components/dashboard/`: dashboard symbols
  (Dashboard, createWidgetRegistry, Widget* types, dashboard labels)
  import from `@knkcs/anker/dashboard` instead of
  `@knkcs/anker/components`. Non-dashboard symbols keep `/components`.
- Verify with mediahub's own build/tests.

## Follow-up — fieldkit (after anker 3.0.0 releases; separate patch)

- Remove the `react-grid-layout` devDependency workaround.
- Widen peer: `@knkcs/anker` `^2.0.0` → `^2.0.0 || ^3.0.0`.

## Testing

- Anker: existing dashboard tests move with the directory and stay
  green; full gate + the new dist regression check; storybook build.
- Mediahub: its existing build/test gate.
- Manual: a scratch consumer (or fieldkit's suite after the follow-up)
  installs anker 3.0.0 WITHOUT react-grid-layout and imports
  `/components` successfully.
