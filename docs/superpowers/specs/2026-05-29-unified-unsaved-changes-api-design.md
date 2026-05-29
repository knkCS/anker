# Unified Unsaved-Changes API — Design

**Date:** 2026-05-29
**Status:** Draft — awaiting review
**Services:** anker (additive 2.8.0), template (small follow-up adoption PR)

## 1. Problem

The template service shipped a clean tabbed-detail dirty UX in PRs #19–#24:

- A multi-key `TabDirtyContext` so any tab trigger can render `<DirtyDot/>`.
- A `TemplateDetailDirtyGuard` that uses `useBlocker` with a same-page-prefix bypass, so intra-page tab switches don't trigger the leave-confirmation modal.
- Several state-persistence providers so tab unmounts don't lose unsaved work.

odon, layout, and core will need the same UX as they grow tabbed detail pages. Today they would copy the template's project-local files, which guarantees drift. We want this to be the canonical knkCMS pattern, owned by anker.

Anker already ships `DirtyDot` (2.7.0), `DirtyCounter`, `DirtyFormGuard`, and `LeavePageConfirmation`. What's missing is (a) the multi-key registry, (b) a navigation guard that's NOT tied to react-hook-form, and (c) a primitive blocker hook for advanced cases (Monaco editor, custom dirty sources).

## 2. Decision

Anker `2.8.0` ships a `src/navigation/` namespace with three new pieces and refactors `DirtyFormGuard` to delegate to them. The `Forms/Dirty surfaces` storybook page becomes the single dirty-UX reference. Template adopts the new pieces in a follow-up PR.

## 3. Anker changes

### 3.1 New folder layout

```
src/navigation/
  use-unsaved-changes-blocker.ts
  unsaved-changes-guard.tsx
  tab-dirty-context.tsx
  index.ts
```

Sub-path export `@knkcs/anker/navigation` added to `package.json`. The existing locations (`DirtyDot` in `src/atoms/`, `DirtyCounter`/`DirtyFormGuard` in `src/forms/`, `LeavePageConfirmation` in `src/primitives/`) stay put — backwards compat — and pick up internal imports from the new folder.

### 3.2 `useUnsavedChangesBlocker(isDirty, opts)`

Primitive hook wrapping react-router's `useBlocker` with a sensible default predicate. Returns the raw `Blocker` so advanced callers can render their own dialog.

```ts
import type { Blocker, Location } from "react-router";

export interface UnsavedChangesBlockerOptions {
  /** Pathname prefix considered "safe". Navigation to a path starting with
   *  this prefix does NOT trigger the block. Use for sibling tabs of the
   *  same detail page (`/foo/bar/${id}/`). Trailing slash matters. */
  safePathPrefix?: string;
  /** Custom predicate. Receives react-router's blocker args. Takes
   *  precedence over `safePathPrefix`. Default: block iff
   *  `isDirty && nextLocation.pathname !== currentLocation.pathname`. */
  shouldBlock?: (args: {
    currentLocation: Location;
    nextLocation: Location;
  }) => boolean;
}

export function useUnsavedChangesBlocker(
  isDirty: boolean,
  opts?: UnsavedChangesBlockerOptions,
): Blocker;
```

Internal logic:

```ts
const blocker = useBlocker(({ currentLocation, nextLocation }) => {
  if (!isDirty) return false;
  if (opts?.shouldBlock) return opts.shouldBlock({ currentLocation, nextLocation });
  if (opts?.safePathPrefix && nextLocation.pathname.startsWith(opts.safePathPrefix)) {
    return false;
  }
  if (nextLocation.pathname === currentLocation.pathname) return false;
  return true;
});
return blocker;
```

### 3.3 `<UnsavedChangesGuard isDirty={…} …/>`

Component composing the hook + `LeavePageConfirmation`. Non-form-aware — works for Monaco buffers, custom hooks, anything with a boolean.

```ts
export interface UnsavedChangesGuardProps
  extends UnsavedChangesBlockerOptions {
  /** Source of truth for whether there's unsaved work. */
  isDirty: boolean;
  /** Dialog title. @default "You have unsaved changes" */
  title?: string;
  /** Dialog message. @default "Are you sure you want to leave this page? You have unsaved changes." */
  message?: string;
  /** Confirm/leave label. @default "Leave" */
  confirmLabel?: string;
  /** Cancel/stay label. @default "Stay" */
  cancelLabel?: string;
}

export function UnsavedChangesGuard(props: UnsavedChangesGuardProps) {
  const { isDirty, safePathPrefix, shouldBlock, ...dialog } = props;
  const blocker = useUnsavedChangesBlocker(isDirty, { safePathPrefix, shouldBlock });
  return (
    <LeavePageConfirmation
      blocked={blocker.state === "blocked"}
      onConfirmLeave={() => blocker.proceed?.()}
      onCancelLeave={() => blocker.reset?.()}
      {...dialog}
    />
  );
}
```

### 3.4 `<DirtyFormGuard …>` becomes a thin wrapper

Existing call sites (`<DirtyFormGuard title="…" …/>` without opts) keep working unchanged. New `safePathPrefix` / `shouldBlock` props added.

```ts
export interface DirtyFormGuardProps
  extends UnsavedChangesBlockerOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function DirtyFormGuard(props: DirtyFormGuardProps) {
  const { formState } = useFormContext();
  return <UnsavedChangesGuard isDirty={formState.isDirty} {...props} />;
}
```

The current `useBlocker` import (`react-router-dom`) is dropped — the import now lives in `useUnsavedChangesBlocker` and uses `react-router` (consistent with the rest of anker).

### 3.5 `<TabDirtyProvider>` + `useTabDirty()`

Lifted verbatim from template's `web/src/pages/templates/tab-dirty-context.tsx`. API unchanged:

```ts
interface TabDirtyState {
  isTabDirty: (key: string) => boolean;
  setTabDirty: (key: string, dirty: boolean) => void;
}
```

Implementation:

```tsx
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

const Ctx = createContext<TabDirtyState>({
  isTabDirty: () => false,
  setTabDirty: () => undefined,
});

export function TabDirtyProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const setTabDirty = useCallback((key: string, v: boolean) => {
    setDirty((prev) => (prev[key] === v ? prev : { ...prev, [key]: v }));
  }, []);
  const isTabDirty = useCallback(
    (key: string) => Boolean(dirty[key]),
    [dirty],
  );
  const value = useMemo(
    () => ({ isTabDirty, setTabDirty }),
    [isTabDirty, setTabDirty],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabDirty(): TabDirtyState {
  return useContext(Ctx);
}
```

## 4. Tests

vitest + `@testing-library/react`. Each test wraps in `<MemoryRouter>` (or `createMemoryRouter`) as needed.

- `use-unsaved-changes-blocker.test.ts` — three cases: (a) `isDirty=false` never blocks; (b) `isDirty=true` blocks external nav (no prefix match); (c) `isDirty=true` allows nav under `safePathPrefix`. Drive transitions via `useNavigate`.
- `unsaved-changes-guard.test.tsx` — when `isDirty=true` and a blocked nav is attempted, `LeavePageConfirmation` renders with the supplied title/message; clicking confirm calls `blocker.proceed`; clicking cancel calls `blocker.reset`.
- `tab-dirty-context.test.tsx` — port the 3 existing template-side tests verbatim (per-key isolation, no-provider fallback, children rendering).
- `dirty-form-guard.test.tsx` — assert that the wrapper renders `UnsavedChangesGuard` with `isDirty` sourced from `useFormContext().formState`, and that `safePathPrefix`/`shouldBlock` pass through. (Existing behaviour smoke: a dirty form blocks navigation when no opts are passed.)

## 5. Docs

`src/forms/dirty-surfaces.mdx` becomes the single dirty-UX reference (it already lives at `Forms/Dirty surfaces` in storybook). Rewrites:

- Update the **Tab-trigger dot** table row to mention `<TabDirtyProvider>` + `useTabDirty()`.
- Add a **TabDirtyProvider** section with the full wiring example: provider at the layout level; consumers (form effect, editor `setTabDirty`) publish; `Tabs.Trigger` renders `<DirtyDot active={isTabDirty(tab.value)}/>`.
- Add an **Intra-page navigation guard** section with two snippets:
  - `<UnsavedChangesGuard isDirty={…} safePathPrefix={…}/>` for non-form sources (Monaco buffer).
  - `<DirtyFormGuard safePathPrefix={…}/>` for react-hook-form pages — same `safePathPrefix` prop, form's `isDirty` resolved automatically.
- A short "when to use which" matrix at the top:
  | Surface | Component | Where it fires |
  |---|---|---|
  | Field-level visual | yellow border + label dot | automatic on `*Field` |
  | Header counter chip | `<DirtyCounter/>` | mount via `usePageActions` |
  | Tab-trigger dot | `<DirtyDot active={…}/>` + `useTabDirty()` | inside `Tabs.Trigger` |
  | Leave-page guard (form) | `<DirtyFormGuard …/>` | inside a `FormProvider` |
  | Leave-page guard (any) | `<UnsavedChangesGuard isDirty={…}/>` | anywhere with a dirty boolean |

The doc stays in `src/forms/` (existing storybook URL preserved). Title remains `Forms/Dirty surfaces`.

## 6. Release

Minor bump `2.7.0 → 2.8.0`. Additive only — no breaking changes.

- `package.json` version field
- `CHANGELOG.md` entry under `## 2.8.0 — 2026-05-29` summarising the new navigation namespace
- Tag `v2.8.0` after merge → triggers existing publish workflow → verify `npm view @knkcs/anker@2.8.0 version`

## 7. Template adoption (separate PR, after 2.8.0 publishes)

Net effect: 2 files deleted, ~6 import lines changed. Total diff is small.

- Bump `web/package.json` → `@knkcs/anker: ^2.8.0`.
- Delete `web/src/pages/templates/tab-dirty-context.tsx` + its test.
- Delete `web/src/pages/templates/template-detail-dirty-guard.tsx`.
- Update imports in `template-detail-layout.tsx`, `editor-tab.tsx`, `editor-state-provider.tsx`, `general-form-provider.tsx`:
  - `from "./tab-dirty-context"` → `from "@knkcs/anker/navigation"`.
- In `general-form-provider.tsx` swap:
  ```tsx
  <TemplateDetailDirtyGuard templateId={template.id} … />
  ```
  for:
  ```tsx
  <DirtyFormGuard
    safePathPrefix={`/template/templates/${template.id}/`}
    title="Ungespeicherte Änderungen"
    message="Möchten Sie die Seite verlassen? Ihre Änderungen gehen verloren."
    confirmLabel="Verlassen"
    cancelLabel="Bleiben"
  />
  ```
  Drop the import of `TemplateDetailDirtyGuard`; keep using `DirtyFormGuard` from `@knkcs/anker/forms`.

The template-side `tab-dirty-context.test.tsx` is replaced by anker's equivalent — no test coverage lost.

## 8. Out of scope

- Auto-save in the Editor tab. Still requires explicit Speichern.
- Generalising `TabDirtyContext` into a `DirtyRegistry` for sidebar items / breadcrumbs / arbitrary surfaces. The current per-buffer dirty in template's sidebar uses a local prop (`dirtyIds: Set<string>`); generalising it is YAGNI until a second consumer materialises.
- Animations or transitions on `<DirtyDot/>`.
- A `useBlocker`-based guard for Monaco unsaved state in the Editor tab — possible now (the new `<UnsavedChangesGuard isDirty={editor.hasAnyDirty}/>` would do it) but the team chose to rely on the tab dot as the in-page signal. Adding the modal is a one-line follow-up if desired.

## 9. Acceptance criteria

- [ ] `@knkcs/anker@2.8.0` published with `useUnsavedChangesBlocker`, `UnsavedChangesGuard`, `TabDirtyProvider`, `useTabDirty` exported from `@knkcs/anker/navigation`.
- [ ] `DirtyFormGuard` accepts `safePathPrefix` / `shouldBlock`; existing callers without those props behave identically (block iff dirty).
- [ ] `Forms/Dirty surfaces` mdx covers all five surfaces (field, counter, tab dot, form guard, generic guard) with runnable snippets.
- [ ] vitest suite green; lint/typecheck/build/verify-exports clean.
- [ ] Template follow-up PR: 2 project-local files deleted; existing manual acceptance (PR #21–#24 behaviour) unchanged after the swap.
