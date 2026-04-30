# Changelog

All notable changes to `@knkcs/anker` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] — 2026-05-01

### Fixed

- **Semantic color tokens now resolve to CSS variables.** Every top-level token (`bg-canvas`, `bg-surface`, `bg-subtle`, `bg-muted`, `default`, `inverted`, `emphasized`, `muted`, `subtle`, `border`, `accent`, `success`, `error`, `bg-accent*`, `on-accent*`) was declared with bare scale strings like `"gray.50"`. Chakra v3 stored those verbatim into the emitted CSS variable, so `--chakra-colors-bg-canvas` evaluated to the literal text `gray.50` — invalid CSS. Consumer styles fell back to `transparent` (for `bg`) and `currentColor` (for `border`), making sidebars look white and borders look near-black. References are now wrapped as `{colors.gray.50}` so Chakra emits proper `var(--chakra-colors-gray-50)` references. Visual regression test added.
- **`Sidebar.Item` now renders the `icon` prop when used with `asChild`.** The previous implementation computed `iconEl` but did not pass it as a child to `React.cloneElement`, so every `<Sidebar.Item asChild>` link rendered without its icon. Fixed by injecting `iconEl` as the first child while preserving the original child content. Test added.

### Added

- `border-muted` semantic token (`gray.100` / `gray.800`) — referenced by `Sidebar.Header` / `Sidebar.Footer` separators since 1.2.0 but never defined; previously fell back to `currentColor` (near-black).

## [1.2.0] — 2026-04-30

### Added

- `<Sidebar>` — compound primitive for the app shell sidebar (240px). Subcomponents: `Header`, `Logo`, `Slot`, `Body`, `Section`, `Item` (with `asChild` and `active`), `Footer`, `UserMenu`, `UserMenuItem`. Cross-product nav surface; consumers slot their own logo, org-switcher, language switcher, etc.
- `<PageHeader>` — per-page imperative header with breadcrumbs, title, optional subtitle, optional eyebrow, and an actions slot.
- `<Toolbar>` — compound primitive for list-page toolbars. Subcomponents: `Search`, `Filters`, `FilterChip` (with `active`), `Right`, `Count`. Pages compose what they need; bulk-action mode is the existing `<BulkActionBar>` (no changes).
- `<ContextRail>` — collapsible right-rail chrome (44 ↔ 360px) with viewport-aware default and `localStorage` persistence via `storageKey`. Subcomponents `Header`, `Section`, `Footer` exported for consumer use.

## [1.1.0] — 2026-04-30

### Added

- `<AuthCard>` — a layout primitive for centered-card auth screens (Login, Register, LoggedOut, etc.). Provides slots for logo, topbar-right content, eyebrow, title, subtitle, footer, and body. Two width presets (`md` 440px, `lg` 480px). Optional dot-grid background and topbar can be hidden for embedded or printable contexts.

## [1.0.0] — 2026-04-30

First stable release. Adopts the refined design-system value set across all token layers.

### Changed (visual — breaking)

- **Primary blue shifted from `#2087d7` to `#134788`** (a darker, more legible navy). Every solid button, link, focus ring, and accent surface in every consumer will visibly change color on upgrade.
- **Primary action anchor moved from `primary.500` to `primary.700`.** The semantic tokens `accent`, `bg-accent`, and `primary.solid`/`focusRing`/`border` now point to step 700. The full primary palette was replaced position-by-position; consumers using `primary.500` directly as a "primary blue" reference will see a different shade — switch to the `accent` semantic token.
- **Brand orange anchor moved from `secondary.500` to `secondary.600`.** `#e9580c` (the brand-guideline orange) now lives at `secondary.600`. Consumers using `secondary.500` for the brand orange now get `#f25f1c` (a lighter shade).
- **All radii tightened by one step.** `md` is now 6px (was 8px); other steps shifted accordingly. Every rounded corner in every consumer becomes ~2px less round.
- **Font stack changed from `InterVariable` to `Inter Tight`.** Consumers must load Inter Tight from Google Fonts; the platform fallback differs slightly.
- **Shadows replaced with softer values.** Diffused, lower-alpha rgba values; the `focus-ring` shadow now uses the new primary tint (`rgba(19,71,136,0.18)`).

### Added

- `gray.950` (`#020617`) — closes the gray scale.
- `secondary.950` (`#411208`) — closes the secondary scale.
- Explicit `success`, `warning`, `danger`, `info` palettes (anker-owned, replacing reliance on Chakra defaults).
- `mono` font stack (`'JetBrains Mono', ui-monospace, …`) for code, IDs, and API keys.
- Named text styles: `bodyLg`, `body`, `bodySm`, `mono`, `monoSm`.
- `docs/design-system.md` — human-facing master spec (hosted on GitHub Pages).
- `CLAUDE-ANKER.md` — AI-consumable design-system rules, shipped in the npm tarball. Consumer projects using Claude Code can `@`-import via `@node_modules/@knkcs/anker/CLAUDE-ANKER.md`.

### Migration notes

Consumers using semantic tokens (`accent`, `bg-canvas`, `border`, `primary.solid`, etc.) get the new visual direction automatically. Consumers using raw tokens (`primary.500`, `secondary.500`) should grep for those references and replace with the corresponding semantic token where possible. The `<Button variant="primary">` variant remains deprecated; prefer `<Button variant="solid">`.
