# Dashboard Subpath Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move anker's Dashboard framework to its own `@knkcs/anker/dashboard` subpath so `react-grid-layout` is resolved only by dashboard consumers (fixes #147), release as 3.0.0, and migrate mediahub.

**Architecture:** `src/components/dashboard/` moves to `src/dashboard/` with its own tsup entry + exports-map entry; the `/components` barrel drops its dashboard blocks; a dist regression check pins that no non-dashboard entry references `react-grid-layout`. Mediahub's 7 dashboard-import files switch specifiers after anker 3.0.0 is published.

**Tech Stack:** tsup, tsx scripts, Biome, Vitest; mediahub: Vite + tsc.

**Spec:** `docs/superpowers/specs/2026-07-05-dashboard-subpath-design.md`

## Global Constraints

- Conventional Commits, imperative, ≤ 72 chars; scope `dashboard` / `components` / `docs` as fits.
- `react-grid-layout` stays a peer with `peerDependenciesMeta.optional: true` — do not change dependency classification.
- The full anker gate must pass per task: `npm run lint && npm run typecheck && npm run build && npm run verify-exports && npm run test` (CI runs exactly this), plus `npm run build:storybook` in Task 1 (story glob is recursive — verify dashboard stories still appear).
- Task 3 (mediahub) runs ONLY after anker v3.0.0 is published to npm (controller sequences the release between Tasks 2 and 3).

---

### Task 1: move the dashboard module + dist regression check

**Files (anker repo, /Users/jeskoiwanovski/repo/anker):**
- Move: `src/components/dashboard/` → `src/dashboard/` (git mv, all 22 files)
- Modify: `src/components/index.ts:28-65` (remove the two dashboard blocks), `tsup.config.ts` (entry), `package.json` (exports map)
- Create: `scripts/check-optional-deps.ts`
- Modify: `package.json` scripts — chain the new check into `verify-exports`

**Interfaces:**
- Produces: `@knkcs/anker/dashboard` entry (`dist/dashboard/index.js` + `.d.ts`) exporting exactly what `src/components/dashboard/index.ts` exports today (Dashboard, DashboardToolbar, createWidgetRegistry, isWidgetAvailable, resolveWidgetSettings, useDashboardDraft, WidgetCatalog, WidgetConfigForm, WidgetFrame, defaultDashboardLabels + all Widget*/Dashboard* types).

- [ ] **Step 1: Write the failing regression check** — `scripts/check-optional-deps.ts`:

```ts
// Fails if any non-dashboard dist entry references an optional peer.
// Guards #147: react-grid-layout must only be reachable via ./dashboard.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const OPTIONAL_DEPS = ["react-grid-layout"];
const ALLOWED_DIRS = new Set(["dashboard"]);

const distDir = join(process.cwd(), "dist");
const offenders: string[] = [];

function walk(dir: string, topLevel: string) {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) {
			walk(full, topLevel);
		} else if (/\.(js|cjs|mjs)$/.test(name)) {
			const content = readFileSync(full, "utf8");
			for (const dep of OPTIONAL_DEPS) {
				// Match import/require specifiers, not the string in a comment:
				if (new RegExp(`(from\\s*["']${dep}|require\\(["']${dep}|import\\(["']${dep})`).test(content)) {
					offenders.push(`${full.replace(distDir + "/", "")} references ${dep}`);
				}
			}
		}
	}
}

for (const top of readdirSync(distDir)) {
	const full = join(distDir, top);
	if (!statSync(full).isDirectory()) {
		// Shared chunks at dist root are reachable from every entry — they
		// must not reference optional deps either.
		if (/\.(js|cjs|mjs)$/.test(top)) {
			const content = readFileSync(full, "utf8");
			for (const dep of OPTIONAL_DEPS) {
				if (new RegExp(`(from\\s*["']${dep}|require\\(["']${dep}|import\\(["']${dep})`).test(content)) {
					offenders.push(`${top} (shared chunk) references ${dep}`);
				}
			}
		}
		continue;
	}
	if (ALLOWED_DIRS.has(top)) continue;
	walk(full, top);
}

if (offenders.length > 0) {
	console.error("check-optional-deps: optional peer leaked into non-dashboard entries:");
	for (const o of offenders) console.error("  -", o);
	process.exit(1);
}
console.log("check-optional-deps: ok — optional peers only reachable via ./dashboard");
```

Note on shared chunks: tsup code-splits shared modules into root-level `chunk-*.js` files imported by multiple entries. If the dashboard's RGL usage lands in a shared chunk imported by `components/index.js`, the check must fail — that's why root chunks are scanned. If after the move a shared chunk legitimately contains RGL but is imported ONLY by `dist/dashboard/index.js`, refine the check to trace chunk importers (read each entry's static import graph) rather than loosening ALLOWED_DIRS — document whichever the build actually produces in the report.

Wire into package.json scripts:
```json
"verify-exports": "tsx scripts/verify-exports.ts && tsx scripts/check-optional-deps.ts",
```

- [ ] **Step 2: Run to verify RED** — `npm run build && npm run verify-exports`
Expected: FAIL — `components/index.js references react-grid-layout` (the current build leaks it).

- [ ] **Step 3: Move the module**

```bash
git mv src/components/dashboard src/dashboard
```

Fix the moved files' outside-directory imports (one level shallower + components-scoped modules re-pointed):
- `src/dashboard/dashboard.tsx`: `"../../atoms/empty-state"` → `"../atoms/empty-state"`; `"../../primitives/layout"` → `"../primitives/layout"`; `"../drawer"` → `"../components/drawer"`
- `src/dashboard/dashboard-toolbar.tsx`: `"../../atoms/button"` → `"../atoms/button"`; `"../../primitives/layout"` → `"../primitives/layout"`
- `src/dashboard/widget-catalog.tsx`: `"../../primitives/layout"` → `"../primitives/layout"`; `"../../primitives/typography"` → `"../primitives/typography"`; `"../drawer"` → `"../components/drawer"`
- `src/dashboard/widget-config-form.tsx`: `"../../primitives/layout"` → `"../primitives/layout"`; `"../../primitives/native-select"` → `"../primitives/native-select"`; `"../../primitives/switch"` → `"../primitives/switch"`; `"../../primitives/typography"` → `"../primitives/typography"`
- `src/dashboard/widget-frame.tsx`: `"../../atoms/button"` → `"../atoms/button"`; `"../../primitives/layout"` → `"../primitives/layout"`; `"../../primitives/typography"` → `"../primitives/typography"`; `"../widget"` → `"../components/widget"`
- `src/dashboard/demo-widgets.tsx`: `"../../primitives/typography"` → `"../primitives/typography"`
(`labels.ts`, `registry.ts`, `resolve-settings.ts`, `types.ts`, `use-dashboard-draft.ts`, and all tests import only `./`-local — untouched. `react-grid-layout/legacy` in dashboard.tsx stays as-is.)

- [ ] **Step 4: Rewire barrel, build entry, exports map**

`src/components/index.ts`: delete the `// Dashboard` type block (the `export type { DashboardDraft, … WidgetSize } from "./dashboard";` statement) AND the value block (`export { createWidgetRegistry, … WidgetFrame } from "./dashboard";`). The surrounding ContextRail and DataTable blocks stay byte-identical.

`tsup.config.ts` entry map gains (alphabetical position fine):
```ts
  "dashboard/index": "src/dashboard/index.ts",
```

`package.json` exports map gains (matching the existing entry style exactly):
```json
  "./dashboard":   { "import": "./dist/dashboard/index.js",   "types": "./dist/dashboard/index.d.ts" },
```

- [ ] **Step 5: Run the full gate to verify GREEN**

```bash
npm run lint && npm run typecheck && npm run build && npm run verify-exports && npm run test && npm run build:storybook
```
Expected: all pass. `verify-exports` validates the new `dashboard/index` entry's d.ts closure AND `check-optional-deps` passes (RGL only under `dist/dashboard/` — see the shared-chunk note in Step 1 if it fails there). Storybook build must still contain the Dashboard stories (recursive glob — spot-check `storybook-static/index.json` for `dashboard`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(dashboard)!: own subpath export, leave /components

BREAKING CHANGE: Dashboard/Widget* exports moved from
@knkcs/anker/components to @knkcs/anker/dashboard so react-grid-layout
is only resolved by dashboard consumers (#147)."
```

---

### Task 2: docs + version 3.0.0

**Files (anker repo):**
- Modify: `CLAUDE-ANKER.md` (Dashboard section + Don't list), `CHANGELOG.md`, `package.json` (version), `src/dashboard/dashboard.mdx` (import path examples, if any name `/components`)

- [ ] **Step 1:** `CLAUDE-ANKER.md` — "the `Dashboard` framework from `@knkcs/anker/components`" → "from `@knkcs/anker/dashboard`"; the Don't-list line becomes: "**Don't import any `react-grid-layout` CSS** — anker ships the grid styles. Just `npm i react-grid-layout@^2.2.3` (optional peer dep, required only by services that import `@knkcs/anker/dashboard`)." Grep the file for any other `/components`-scoped dashboard references.
- [ ] **Step 2:** `src/dashboard/dashboard.mdx` — update any `@knkcs/anker/components` import examples to `@knkcs/anker/dashboard` (grep first; update all hits).
- [ ] **Step 3:** `CHANGELOG.md` — new top entry:

```md
## 3.0.0 — 2026-07-05

### Breaking

- **Dashboard moved to its own subpath.** All Dashboard/Widget exports
  (`Dashboard`, `DashboardToolbar`, `createWidgetRegistry`,
  `useDashboardDraft`, `WidgetCatalog`, `WidgetConfigForm`,
  `WidgetFrame`, `resolveWidgetSettings`, `isWidgetAvailable`,
  `defaultDashboardLabels`, and the `Dashboard*`/`Widget*`/`GridConfig`
  types) now live at `@knkcs/anker/dashboard` instead of
  `@knkcs/anker/components`. Migration: change the import specifier —
  symbol names are unchanged. Why: `react-grid-layout` is an optional
  peer, but the `/components` barrel's static import forced EVERY barrel
  consumer to install it (#147). The module graph now enforces the
  optionality: only `/dashboard` importers resolve it. A
  `check-optional-deps` dist check guards the boundary in CI.
```

- [ ] **Step 4:** `package.json`: `"version": "3.0.0"`.
- [ ] **Step 5:** Full gate (same command chain as Task 1 Step 5) → all pass. Commit:

```bash
git add CLAUDE-ANKER.md CHANGELOG.md package.json src/dashboard/dashboard.mdx
git commit -m "docs(dashboard): 3.0.0 changelog and import-path updates"
```

---

### Task 3: mediahub migration — AFTER anker v3.0.0 is on npm

**Files (mediahub repo, /Users/jeskoiwanovski/repo/mediahub/web):**
- Modify: `package.json` (anker range), and exactly these 7 files' import specifiers:
  `src/components/dashboard/registry.ts`, `src/pages/dashboard-page.tsx`,
  `src/components/dashboard/{asset-count,recent-uploads,status-breakdown,current-time,current-date}-widget.tsx`

**Interfaces:**
- Consumes: published `@knkcs/anker@3.0.0` with the `./dashboard` subpath.

- [ ] **Step 1:** `web/package.json`: `"@knkcs/anker": "^2.11.0"` → `"^3.0.0"`; run `npm install` in `web/`.
- [ ] **Step 2:** In the 7 files, change ONLY the specifier `"@knkcs/anker/components"` → `"@knkcs/anker/dashboard"` (recon verified: no file mixes dashboard and non-dashboard symbols in one import, so this is a pure specifier swap; symbol lists unchanged).
- [ ] **Step 3:** Gate (mediahub web scripts): `npm run tscheck && npm run lint && npm run build && npm run test` — all pass. (`react-grid-layout` is already a direct dependency of mediahub web — unchanged.)
- [ ] **Step 4:** Commit in the mediahub repo:

```bash
git add web/package.json web/package-lock.json web/src
git commit -m "build(web): anker 3.0.0 — dashboard imports via new subpath"
```
(Do NOT push mediahub without the owner's go-ahead if its main is protected/reviewed — report and let the controller decide.)

---

## Self-Review Notes

- Spec coverage: move+entry+exports (T1 steps 3-4), barrel removal (T1.4), regression pin incl. shared-chunk scan (T1.1), docs/changelog/version (T2), mediahub (T3), fieldkit follow-up intentionally NOT in this plan (separate repo/patch, spec notes it).
- The RED for the regression check is natural: it fails against the CURRENT build before the move (T1.2), passes after (T1.5).
- Release sequencing lives with the controller: T1+T2 → merge → tag v3.0.0 (publish.yml runs the gate + npm publish) → T3.
