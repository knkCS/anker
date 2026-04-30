# anker Design System — AI Rules

This file is designed to be `@`-imported into a consumer project's `CLAUDE.md` so Claude Code instances working on that project automatically follow the anker design system. Add this line to your root `CLAUDE.md`:

```
@node_modules/@knkcs/anker/CLAUDE-ANKER.md
```

The full human-facing spec lives at the anker GitHub Pages docs site (linked from the `@knkcs/anker` README).

---

## Five design principles

1. **Refined Minimalism.** Surfaces are calm. Brand colors are the crown, not the carpet — primary action only.
2. **Density over air.** Power users spend hours here. Compact rows, tight spacing, small UI sizes — never cramped.
3. **Consistency over creativity.** If a pattern exists (status pill, empty state, filter toolbar), use it as-is. No per-product variants.
4. **Clear hierarchy.** Page title, primary action, content — answerable in under a second.
5. **Keyboard-first where it matters.** Search (`/`), command palette (`⌘K`), navigation must be keyboard-operable. Show shortcuts in tooltips.

---

## Token quick reference

**Palette anchors** (the visually-load-bearing step in each scale):
- `primary.700` (`#134788`) — action color (buttons, links, focus rings, active states)
- `secondary.600` (`#e9580c`) — brand orange (use sparingly; not for standard CTAs)
- `gray.700` — body text
- `gray.900` — headings

**Brand colors** (`brand.*`) — exact knk Brand Guidelines values for logos, headers, about pages. Do **not** use for interactive UI.

**Semantic tokens** (prefer these over raw):
- `bg-canvas` (page frame), `bg-surface` (cards/modals), `bg-subtle` (toolbars), `bg-muted` (hover)
- `default` / `emphasized` / `muted` / `subtle` (text)
- `border` (standard 1px), `accent` (action), `success`, `error`

**Defaults:**
- Border radius: `md` = 6px (use this for buttons, inputs, small cards)
- Body font size: `md` = 14px
- Font stack assumes Inter Tight (UI) and JetBrains Mono (code) — consumer must load via Google Fonts
- Light + dark mode supported via `next-themes`

---

## Do

- **Use semantic tokens before raw tokens.** Reach for `accent` before `primary.700`. Why: semantic tokens are the contract, raw tokens are the implementation; raw use becomes a search-and-replace cost on the next visual update.
- **Use `<Button variant="solid">` (not `variant="primary"`).** The `primary` variant is deprecated in anker. Why: `solid` reads from `colorPalette` automatically, so the same component works for `colorPalette="primary"`, `colorPalette="secondary"`, `colorPalette="gray"`.
- **Use `brand.*` only for branding surfaces.** Logos, headers, about pages. Why: brand colors are print-aligned and not WCAG-tuned for interactive UI.
- **Use anker components instead of raw Chakra.** Import from `@knkcs/anker/{primitives,components,atoms,forms,feedback}`. Why: anker wraps Chakra with consistent defaults; consuming raw Chakra bypasses those defaults and creates visual drift.
- **Respect `prefers-reduced-motion`.** No per-component handling needed — anker's theme enforces this globally. Why: users who set this OS preference get a broken UI if components add their own motion.

---

## Don't

- **No hex codes inline in components.** Always use tokens. Why: hex codes don't update when the design system evolves; tokens do.
- **No Material-style large shadows.** Anker shadows are deliberately dezent. Why: heavy shadows read as Material/Bootstrap-4-era and clash with the refined direction.
- **No `secondary.500` for standard CTAs.** The brand orange now lives at `secondary.600`; `secondary.500` is a lighter shade. Why: standard CTAs use `primary.700`, not orange — orange is for branded moments only.
- **No mixing radii within one component group.** A card with `lg` can hold inputs with `md`, but not a mix of `md` and `lg` siblings. Why: visual rhythm breaks when adjacent elements have different roundness.
- **No animations over 300ms.** Outside marketing/onboarding. Why: long animations slow down power users; the design language values immediacy.
- **No Chakra v2 patterns.** No `extendTheme`, `colorScheme`, `useColorMode` from `@chakra-ui/react`. Use `createSystem`, `colorPalette`, `next-themes`. Why: anker is built on Chakra v3 throughout; v2 patterns either error at build time or silently no-op.
- **No new color introductions.** If a color isn't in `colors.ts`, it doesn't exist. Why: the palette is closed by design — adding ad-hoc colors fragments the system.

---

## Pointers

- Full spec: anker GitHub Pages docs site (`/design-system`)
- Components: `node_modules/@knkcs/anker/dist/{primitives,components,atoms,forms,feedback}`
- Theme entry: `import system from "@knkcs/anker/theme"`
- Provider entry: `import { Provider } from "@knkcs/anker/primitives"`
- Anker development rules (for working *on* anker, not consuming it): `node_modules/@knkcs/anker/CLAUDE.md` is **not** included in the package; see the anker GitHub repo
