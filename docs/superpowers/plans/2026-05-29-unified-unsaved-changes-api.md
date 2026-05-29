# Unified Unsaved-Changes API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@knkcs/anker@2.8.0` with a new `src/navigation/` namespace exposing `useUnsavedChangesBlocker`, `<UnsavedChangesGuard/>`, `<TabDirtyProvider>`, and `useTabDirty()`. `DirtyFormGuard` refactored to delegate (backwards-compat). `Forms/Dirty surfaces` docs become the single dirty-UX reference.

**Architecture:** Three new files in `src/navigation/`. `DirtyFormGuard` becomes a thin wrapper over `<UnsavedChangesGuard isDirty={useFormContext().formState.isDirty}/>`. Tests use `createMemoryRouter` + `RouterProvider` (required for `useBlocker` — the legacy `<MemoryRouter>` JSX form is NOT a data router and breaks `useBlocker`). Minor version bump, additive only.

**Tech Stack:** React 19, react-router-dom v7 (data router APIs), Chakra v3 primitives, Vitest + `@testing-library/react`, tsup bundling, Storybook 8 mdx.

**Spec:** `/Users/jeskoiwanovski/repo/anker/docs/superpowers/specs/2026-05-29-unified-unsaved-changes-api-design.md`.

---

## File structure

| File | Responsibility |
|---|---|
| `src/navigation/use-unsaved-changes-blocker.ts` | `useUnsavedChangesBlocker(isDirty, opts) → Blocker` primitive hook + `UnsavedChangesBlockerOptions` type. |
| `src/navigation/use-unsaved-changes-blocker.test.tsx` | Three vitest cases (clean / blocks external / allows safePathPrefix). |
| `src/navigation/unsaved-changes-guard.tsx` | `<UnsavedChangesGuard/>` component + `UnsavedChangesGuardProps` type. |
| `src/navigation/unsaved-changes-guard.test.tsx` | Renders dialog when blocked; confirm/cancel wires correctly. |
| `src/navigation/tab-dirty-context.tsx` | `<TabDirtyProvider/>` + `useTabDirty()` + `TabDirtyState` type. |
| `src/navigation/tab-dirty-context.test.tsx` | Three cases (per-key isolation / no-provider default / renders children). |
| `src/navigation/index.ts` | Barrel for the four exports + their types. |
| `src/forms/dirty-form-guard.tsx` | Refactor to delegate to `<UnsavedChangesGuard/>`; accept `safePathPrefix` / `shouldBlock`. |
| `src/forms/dirty-form-guard.test.tsx` | New test confirming delegation + opts pass-through + backwards-compat default. |
| `src/forms/dirty-surfaces.mdx` | Rewrite to cover all five surfaces. |
| `package.json` | Add `./navigation` export entry; bump version 2.7.0 → 2.8.0. |
| `tsup.config.ts` | Add `navigation/index` entry. |
| `CHANGELOG.md` | Prepend 2.8.0 entry. |

---

### Task 1: Failing test for `useUnsavedChangesBlocker`

**Files:**
- Create: `src/navigation/use-unsaved-changes-blocker.test.tsx`

- [ ] **Step 1: Write the failing test**

`useBlocker` requires a data router. Use `createMemoryRouter` + `RouterProvider`.

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { useNavigate } from "react-router-dom";
import {
	RouterProvider,
	createMemoryRouter,
} from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useUnsavedChangesBlocker } from "./use-unsaved-changes-blocker";

function makeRouter(opts: {
	isDirty: boolean;
	safePathPrefix?: string;
	initial?: string;
}) {
	function Probe() {
		const navigate = useNavigate();
		const blocker = useUnsavedChangesBlocker(opts.isDirty, {
			safePathPrefix: opts.safePathPrefix,
		});
		return (
			<>
				<span data-testid="state">{blocker.state}</span>
				<button
					type="button"
					data-testid="goto-external"
					onClick={() => navigate("/other")}
				>
					external
				</button>
				<button
					type="button"
					data-testid="goto-safe"
					onClick={() => navigate("/detail/abc/editor")}
				>
					safe
				</button>
			</>
		);
	}
	return createMemoryRouter(
		[
			{ path: "/detail/abc/general", element: <Probe /> },
			{ path: "/detail/abc/editor", element: <span>editor</span> },
			{ path: "/other", element: <span>other</span> },
		],
		{ initialEntries: [opts.initial ?? "/detail/abc/general"] },
	);
}

function renderRouter(router: ReturnType<typeof createMemoryRouter>) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<RouterProvider router={router} />
		</ChakraProvider>,
	);
}

describe("useUnsavedChangesBlocker", () => {
	it("never blocks when isDirty is false", async () => {
		const router = makeRouter({ isDirty: false });
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("goto-external").click();
		});
		expect(screen.getByText("other")).toBeTruthy();
	});

	it("blocks external navigation when isDirty is true", async () => {
		const router = makeRouter({ isDirty: true });
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("goto-external").click();
		});
		expect(screen.getByTestId("state").textContent).toBe("blocked");
	});

	it("allows navigation to paths under safePathPrefix even when dirty", async () => {
		const router = makeRouter({
			isDirty: true,
			safePathPrefix: "/detail/abc/",
		});
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("goto-safe").click();
		});
		expect(screen.getByText("editor")).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/navigation/use-unsaved-changes-blocker.test.tsx`
Expected: FAIL — `Failed to resolve import "./use-unsaved-changes-blocker"`.

- [ ] **Step 3: Commit failing test**

Branch is already `feat/unified-unsaved-changes-api` (spec commit `772d0e6` is on it). Do NOT create a new branch.

```bash
git add src/navigation/use-unsaved-changes-blocker.test.tsx
git commit -m "test(navigation): add failing tests for useUnsavedChangesBlocker"
```

---

### Task 2: Implement `useUnsavedChangesBlocker`

**Files:**
- Create: `src/navigation/use-unsaved-changes-blocker.ts`

- [ ] **Step 1: Implement**

```ts
import type { Blocker, Location } from "react-router-dom";
import { useBlocker } from "react-router-dom";

export interface UnsavedChangesBlockerOptions {
	/**
	 * Pathname prefix considered "safe" — navigation to a path starting with
	 * this prefix does NOT trigger the block. Use for sibling tabs of the
	 * same detail page (e.g. `/foo/bar/${id}/`). Trailing slash matters.
	 */
	safePathPrefix?: string;
	/**
	 * Custom predicate. Receives react-router's blocker args. Takes
	 * precedence over `safePathPrefix`. Default: block iff
	 * `isDirty && nextLocation.pathname !== currentLocation.pathname`.
	 */
	shouldBlock?: (args: {
		currentLocation: Location;
		nextLocation: Location;
	}) => boolean;
}

/**
 * Block in-app navigation while there are unsaved changes.
 *
 * Returns the raw react-router `Blocker` so the caller can render their own
 * dialog. For the conventional dialog UX use `<UnsavedChangesGuard/>` (which
 * composes this hook with `<LeavePageConfirmation/>`).
 *
 * Requires a react-router-dom **data router** (`createBrowserRouter` /
 * `createMemoryRouter` + `<RouterProvider/>`). The legacy `<BrowserRouter>` /
 * `<MemoryRouter>` JSX routers do not implement `useBlocker`.
 */
export function useUnsavedChangesBlocker(
	isDirty: boolean,
	opts?: UnsavedChangesBlockerOptions,
): Blocker {
	const blocker = useBlocker(({ currentLocation, nextLocation }) => {
		if (!isDirty) return false;
		if (opts?.shouldBlock) {
			return opts.shouldBlock({ currentLocation, nextLocation });
		}
		if (
			opts?.safePathPrefix &&
			nextLocation.pathname.startsWith(opts.safePathPrefix)
		) {
			return false;
		}
		if (nextLocation.pathname === currentLocation.pathname) return false;
		return true;
	});
	return blocker;
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/navigation/use-unsaved-changes-blocker.test.tsx`
Expected: PASS — 3/3.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/use-unsaved-changes-blocker.ts
git commit -m "feat(navigation): add useUnsavedChangesBlocker primitive"
```

---

### Task 3: Failing test for `<UnsavedChangesGuard/>`

**Files:**
- Create: `src/navigation/unsaved-changes-guard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { useNavigate } from "react-router-dom";
import {
	RouterProvider,
	createMemoryRouter,
} from "react-router-dom";
import { describe, expect, it } from "vitest";
import { UnsavedChangesGuard } from "./unsaved-changes-guard";

function makeRouter(isDirty: boolean) {
	function Probe() {
		const navigate = useNavigate();
		return (
			<>
				<UnsavedChangesGuard
					isDirty={isDirty}
					title="Test title"
					message="Test message"
					confirmLabel="Leave!"
					cancelLabel="Stay!"
				/>
				<button
					type="button"
					data-testid="leave"
					onClick={() => navigate("/elsewhere")}
				>
					leave
				</button>
			</>
		);
	}
	return createMemoryRouter(
		[
			{ path: "/start", element: <Probe /> },
			{ path: "/elsewhere", element: <span>elsewhere</span> },
		],
		{ initialEntries: ["/start"] },
	);
}

function renderRouter(router: ReturnType<typeof createMemoryRouter>) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<RouterProvider router={router} />
		</ChakraProvider>,
	);
}

describe("UnsavedChangesGuard", () => {
	it("does not interrupt navigation when isDirty is false", async () => {
		const router = makeRouter(false);
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("leave").click();
		});
		expect(screen.getByText("elsewhere")).toBeTruthy();
	});

	it("renders the dialog with supplied labels when dirty navigation is attempted", async () => {
		const router = makeRouter(true);
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("leave").click();
		});
		expect(screen.getByText("Test title")).toBeTruthy();
		expect(screen.getByText("Test message")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Leave!" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Stay!" })).toBeTruthy();
	});

	it("proceeds with navigation when the user confirms", async () => {
		const router = makeRouter(true);
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("leave").click();
		});
		await act(async () => {
			screen.getByRole("button", { name: "Leave!" }).click();
		});
		expect(screen.getByText("elsewhere")).toBeTruthy();
	});

	it("stays on the page when the user cancels", async () => {
		const router = makeRouter(true);
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("leave").click();
		});
		await act(async () => {
			screen.getByRole("button", { name: "Stay!" }).click();
		});
		expect(screen.queryByText("elsewhere")).toBeNull();
		expect(screen.getByTestId("leave")).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/navigation/unsaved-changes-guard.test.tsx`
Expected: FAIL — `Failed to resolve import "./unsaved-changes-guard"`.

- [ ] **Step 3: Commit failing test**

```bash
git add src/navigation/unsaved-changes-guard.test.tsx
git commit -m "test(navigation): add failing tests for UnsavedChangesGuard"
```

---

### Task 4: Implement `<UnsavedChangesGuard/>`

**Files:**
- Create: `src/navigation/unsaved-changes-guard.tsx`

- [ ] **Step 1: Implement**

```tsx
import { LeavePageConfirmation } from "../primitives/leave-page-confirmation";
import {
	type UnsavedChangesBlockerOptions,
	useUnsavedChangesBlocker,
} from "./use-unsaved-changes-blocker";

export interface UnsavedChangesGuardProps
	extends UnsavedChangesBlockerOptions {
	/** Source of truth for whether there's unsaved work. */
	isDirty: boolean;
	/** Dialog title. @default "You have unsaved changes" */
	title?: string;
	/** Dialog message body. @default "Are you sure you want to leave this page? You have unsaved changes." */
	message?: string;
	/** Confirm/leave label. @default "Leave" */
	confirmLabel?: string;
	/** Cancel/stay label. @default "Stay" */
	cancelLabel?: string;
}

/**
 * Blocks in-app navigation while `isDirty` is true and renders
 * `LeavePageConfirmation` to ask the user to confirm. Non-form-aware —
 * pass any boolean (form `formState.isDirty`, Monaco buffer state, etc.).
 * For react-hook-form pages use `<DirtyFormGuard/>` which sources `isDirty`
 * from `useFormContext()` automatically.
 *
 * Use `safePathPrefix` to exempt sibling tabs of the same detail page:
 *
 * ```tsx
 * <UnsavedChangesGuard
 *   isDirty={editor.hasAnyDirty}
 *   safePathPrefix={`/template/templates/${templateId}/`}
 * />
 * ```
 */
export function UnsavedChangesGuard({
	isDirty,
	safePathPrefix,
	shouldBlock,
	title,
	message,
	confirmLabel,
	cancelLabel,
}: UnsavedChangesGuardProps) {
	const blocker = useUnsavedChangesBlocker(isDirty, {
		safePathPrefix,
		shouldBlock,
	});
	return (
		<LeavePageConfirmation
			blocked={blocker.state === "blocked"}
			onConfirmLeave={() => blocker.proceed?.()}
			onCancelLeave={() => blocker.reset?.()}
			title={title}
			message={message}
			confirmLabel={confirmLabel}
			cancelLabel={cancelLabel}
		/>
	);
}
UnsavedChangesGuard.displayName = "UnsavedChangesGuard";
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/navigation/unsaved-changes-guard.test.tsx`
Expected: PASS — 4/4.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/unsaved-changes-guard.tsx
git commit -m "feat(navigation): add UnsavedChangesGuard component"
```

---

### Task 5: Failing test for `TabDirtyContext`

**Files:**
- Create: `src/navigation/tab-dirty-context.test.tsx`

- [ ] **Step 1: Write the failing test**

(Port of the existing template-side tests, no router needed.)

```tsx
import { act, render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TabDirtyProvider, useTabDirty } from "./tab-dirty-context";

describe("TabDirtyContext", () => {
	it("starts clean for any key and flips per key independently", () => {
		const { result } = renderHook(() => useTabDirty(), {
			wrapper: ({ children }) => (
				<TabDirtyProvider>{children}</TabDirtyProvider>
			),
		});
		expect(result.current.isTabDirty("editor")).toBe(false);
		expect(result.current.isTabDirty("general")).toBe(false);

		act(() => result.current.setTabDirty("editor", true));
		expect(result.current.isTabDirty("editor")).toBe(true);
		expect(result.current.isTabDirty("general")).toBe(false);

		act(() => result.current.setTabDirty("general", true));
		expect(result.current.isTabDirty("editor")).toBe(true);
		expect(result.current.isTabDirty("general")).toBe(true);

		act(() => result.current.setTabDirty("editor", false));
		expect(result.current.isTabDirty("editor")).toBe(false);
		expect(result.current.isTabDirty("general")).toBe(true);
	});

	it("default (no provider) returns clean state and no-op setter", () => {
		const { result } = renderHook(() => useTabDirty());
		expect(result.current.isTabDirty("editor")).toBe(false);
		expect(() => result.current.setTabDirty("editor", true)).not.toThrow();
	});

	it("renders children", () => {
		const { getByText } = render(
			<TabDirtyProvider>
				<span>hello</span>
			</TabDirtyProvider>,
		);
		expect(getByText("hello")).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/navigation/tab-dirty-context.test.tsx`
Expected: FAIL — `Failed to resolve import "./tab-dirty-context"`.

- [ ] **Step 3: Commit failing test**

```bash
git add src/navigation/tab-dirty-context.test.tsx
git commit -m "test(navigation): add failing tests for TabDirtyContext"
```

---

### Task 6: Implement `TabDirtyContext`

**Files:**
- Create: `src/navigation/tab-dirty-context.tsx`

- [ ] **Step 1: Implement**

(Verbatim from template's working implementation, with anker tab/comment style.)

```tsx
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface TabDirtyState {
	/** Returns true if a tab key has been marked dirty. */
	isTabDirty: (key: string) => boolean;
	/** Mark a tab key as dirty (true) or clean (false). */
	setTabDirty: (key: string, dirty: boolean) => void;
}

const Ctx = createContext<TabDirtyState>({
	isTabDirty: () => false,
	setTabDirty: () => undefined,
});

/**
 * Multi-key registry for per-tab dirty state. Mount at the layout level
 * of a tabbed detail page; have each tab's content publish its dirty
 * state via `setTabDirty(tabKey, isDirty)` and render `<DirtyDot
 * active={isTabDirty(tab.value)}/>` inside each `Tabs.Trigger`.
 *
 * The no-provider fallback returns clean state and a no-op setter so
 * consumers don't have to defensively check.
 */
export function TabDirtyProvider({ children }: { children: ReactNode }) {
	const [dirty, setDirty] = useState<Record<string, boolean>>({});

	const setTabDirty = useCallback((key: string, v: boolean) => {
		setDirty((prev) => (prev[key] === v ? prev : { ...prev, [key]: v }));
	}, []);

	const isTabDirty = useCallback(
		(key: string) => Boolean(dirty[key]),
		[dirty],
	);

	const value = useMemo<TabDirtyState>(
		() => ({ isTabDirty, setTabDirty }),
		[isTabDirty, setTabDirty],
	);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabDirty(): TabDirtyState {
	return useContext(Ctx);
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/navigation/tab-dirty-context.test.tsx`
Expected: PASS — 3/3.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/tab-dirty-context.tsx
git commit -m "feat(navigation): add TabDirtyProvider + useTabDirty"
```

---

### Task 7: Navigation barrel + tsup entry + sub-path export

**Files:**
- Create: `src/navigation/index.ts`
- Modify: `tsup.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Create barrel**

`src/navigation/index.ts`:

```ts
// useUnsavedChangesBlocker
export {
	useUnsavedChangesBlocker,
	type UnsavedChangesBlockerOptions,
} from "./use-unsaved-changes-blocker";

// UnsavedChangesGuard
export {
	UnsavedChangesGuard,
	type UnsavedChangesGuardProps,
} from "./unsaved-changes-guard";

// TabDirtyContext
export {
	TabDirtyProvider,
	useTabDirty,
	type TabDirtyState,
} from "./tab-dirty-context";
```

- [ ] **Step 2: Add tsup entry**

In `tsup.config.ts`, append to the `entry` map (alongside `forms/index`, `feedback/index`, etc.):

```ts
		"navigation/index": "src/navigation/index.ts",
```

The relevant block becomes:

```ts
	entry: {
		"theme/index": "src/theme/index.ts",
		"primitives/index": "src/primitives/index.ts",
		"components/index": "src/components/index.ts",
		"atoms/index": "src/atoms/index.ts",
		"forms/index": "src/forms/index.ts",
		"feedback/index": "src/feedback/index.ts",
		"templates/index": "src/templates/index.ts",
		"navigation/index": "src/navigation/index.ts",
	},
```

- [ ] **Step 3: Add sub-path export to package.json**

In `package.json`'s `exports` map (alongside `./forms`, `./feedback`, etc.) add:

```json
		"./navigation": {
			"import": "./dist/navigation/index.js",
			"types": "./dist/navigation/index.d.ts"
		},
```

- [ ] **Step 4: Build + verify-exports**

Run: `npm run build && npm run verify-exports`
Expected: clean. The verify-exports output should mention 8 tsup entries (was 7), and `useUnsavedChangesBlocker`, `UnsavedChangesGuard`, `TabDirtyProvider`, `useTabDirty` resolve from `@knkcs/anker/navigation`.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/index.ts tsup.config.ts package.json
git commit -m "feat(navigation): wire navigation sub-path export"
```

---

### Task 8: Refactor `DirtyFormGuard` to delegate

**Files:**
- Modify: `src/forms/dirty-form-guard.tsx`
- Create: `src/forms/dirty-form-guard.test.tsx`

- [ ] **Step 1: Write the failing test for the new behaviour**

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
	RouterProvider,
	createMemoryRouter,
} from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DirtyFormGuard } from "./dirty-form-guard";

function makeRouter(opts: {
	defaultDirty: boolean;
	safePathPrefix?: string;
}) {
	function FormHost() {
		const form = useForm<{ name: string }>({
			defaultValues: { name: opts.defaultDirty ? "" : "saved" },
		});
		// Make the form "dirty" by changing a value at mount if requested.
		if (opts.defaultDirty) {
			form.setValue("name", "typed", { shouldDirty: true });
		}
		const navigate = useNavigate();
		return (
			<FormProvider {...form}>
				<DirtyFormGuard
					safePathPrefix={opts.safePathPrefix}
					title="Form title"
					message="Form message"
					confirmLabel="Leave"
					cancelLabel="Stay"
				/>
				<button
					type="button"
					data-testid="external"
					onClick={() => navigate("/elsewhere")}
				>
					external
				</button>
				<button
					type="button"
					data-testid="safe"
					onClick={() => navigate("/detail/abc/editor")}
				>
					safe
				</button>
			</FormProvider>
		);
	}
	return createMemoryRouter(
		[
			{ path: "/detail/abc/general", element: <FormHost /> },
			{ path: "/detail/abc/editor", element: <span>editor</span> },
			{ path: "/elsewhere", element: <span>elsewhere</span> },
		],
		{ initialEntries: ["/detail/abc/general"] },
	);
}

function renderRouter(router: ReturnType<typeof createMemoryRouter>) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<RouterProvider router={router} />
		</ChakraProvider>,
	);
}

describe("DirtyFormGuard", () => {
	it("blocks external navigation when the form is dirty (no opts)", async () => {
		const router = makeRouter({ defaultDirty: true });
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("external").click();
		});
		expect(screen.getByText("Form title")).toBeTruthy();
	});

	it("does not block when the form is clean", async () => {
		const router = makeRouter({ defaultDirty: false });
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("external").click();
		});
		expect(screen.getByText("elsewhere")).toBeTruthy();
	});

	it("allows safePathPrefix navigation even when dirty", async () => {
		const router = makeRouter({
			defaultDirty: true,
			safePathPrefix: "/detail/abc/",
		});
		renderRouter(router);
		await act(async () => {
			screen.getByTestId("safe").click();
		});
		expect(screen.getByText("editor")).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test to verify the safePathPrefix case fails on current impl**

Run: `npx vitest run src/forms/dirty-form-guard.test.tsx`
Expected: tests #1 and #2 PASS (existing behaviour); test #3 FAILS (current `DirtyFormGuard` ignores `safePathPrefix`).

- [ ] **Step 3: Refactor DirtyFormGuard to delegate**

Replace the full contents of `src/forms/dirty-form-guard.tsx`:

```tsx
import type React from "react";
import { useFormContext } from "react-hook-form";
import {
	UnsavedChangesGuard,
	type UnsavedChangesGuardProps,
} from "../navigation/unsaved-changes-guard";

export interface DirtyFormGuardProps
	extends Omit<UnsavedChangesGuardProps, "isDirty"> {
	// Inherits title/message/confirmLabel/cancelLabel/safePathPrefix/shouldBlock
	// from UnsavedChangesGuardProps; `isDirty` is resolved from
	// `useFormContext().formState.isDirty`.
}

/**
 * Form-aware shortcut for `<UnsavedChangesGuard/>`: sources `isDirty` from
 * the surrounding `useFormContext()`. Must be mounted inside a
 * `<FormProvider/>`. For non-form dirty sources (Monaco buffer, custom
 * hook) use `<UnsavedChangesGuard isDirty={…}/>` directly.
 *
 * Pass `safePathPrefix` to exempt sibling tabs of the same detail page
 * from the leave-confirmation modal.
 */
export const DirtyFormGuard: React.FC<DirtyFormGuardProps> = (props) => {
	const { formState } = useFormContext();
	return <UnsavedChangesGuard isDirty={formState.isDirty} {...props} />;
};
DirtyFormGuard.displayName = "DirtyFormGuard";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/forms/dirty-form-guard.test.tsx`
Expected: PASS — 3/3.

- [ ] **Step 5: Commit**

```bash
git add src/forms/dirty-form-guard.tsx src/forms/dirty-form-guard.test.tsx
git commit -m "refactor(forms): DirtyFormGuard delegates to UnsavedChangesGuard"
```

---

### Task 9: Update `dirty-surfaces.mdx`

**Files:**
- Modify: `src/forms/dirty-surfaces.mdx`

- [ ] **Step 1: Rewrite the page**

Replace the file contents with this expanded version covering all five surfaces:

```mdx
import { Meta } from "@storybook/blocks";

<Meta title="Forms/Dirty surfaces" />

# Dirty surfaces

knkCMS surfaces unsaved changes in five coordinated ways. Use the
matching component for the surface you need — don't invent new dirty
visuals.

| Surface | Component | Where it fires |
|---|---|---|
| **Field-level dirty visual** | yellow input border + dot on label | automatic on `InputField` / `SelectField` / `SwitchField` / `TextareaField` / `ArrayField` / `RadioGroupField` / `CheckboxField` via `formState.dirtyFields`. Opt out with `showDirtyState={false}`. |
| **Header counter chip** | `<DirtyCounter />` | reads dirty count from `useFormContext`. Mount in the page header via `usePageActions`. |
| **Tab-trigger dot** | `<DirtyDot active={…} />` + `useTabDirty()` | publishes/consumes per-tab dirty state. Mount inside each `Tabs.Trigger`. |
| **Leave-page guard (form)** | `<DirtyFormGuard />` | inside a `<FormProvider/>`. Intercepts navigation when the form is dirty. |
| **Leave-page guard (any)** | `<UnsavedChangesGuard isDirty={…} />` | for non-form dirty sources (Monaco buffer, custom hook, etc.). |

## Field-level dirty visual

```tsx
import { InputField } from "@knkcs/anker/forms";

<InputField name="title" label="Title" />
// Yellow border + label dot appear automatically when the field is dirty.
```

## Header counter chip

```tsx
import { DirtyCounter } from "@knkcs/anker/forms";
import { usePageActions } from "@knkcs/anker/templates";

usePageActions(<DirtyCounter />);
```

## Tab-trigger dot

Wire any number of dirty sources to a tabbed detail page. Each
content tab publishes its own dirty state; the layout's `Tabs.Trigger`
renders `<DirtyDot/>` against the registry.

```tsx
import { DirtyDot } from "@knkcs/anker/atoms";
import { TabDirtyProvider, useTabDirty } from "@knkcs/anker/navigation";

// Layout
function DetailLayout() {
  return (
    <TabDirtyProvider>
      <DetailLayoutInner />
    </TabDirtyProvider>
  );
}

function DetailLayoutInner() {
  const { isTabDirty } = useTabDirty();
  return (
    <Tabs.Root>
      <Tabs.List>
        {tabs.map((t) => (
          <Tabs.Trigger key={t.value} value={t.value}>
            {t.label}
            <DirtyDot active={isTabDirty(t.value)} />
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

// A tab that publishes its dirty state (form example)
function GeneralTab() {
  const { setTabDirty } = useTabDirty();
  const { formState } = useFormContext();
  useEffect(() => {
    setTabDirty("general", formState.isDirty);
    return () => setTabDirty("general", false);
  }, [formState.isDirty, setTabDirty]);
  // …
}
```

## Leave-page guard

Block in-app navigation while there are unsaved changes. Use
`safePathPrefix` to exempt sibling tabs of the same detail page so
intra-page tab switches don't trigger the modal.

**Form-aware (most common):**

```tsx
import { DirtyFormGuard } from "@knkcs/anker/forms";

<FormProvider {...form}>
  <DirtyFormGuard
    safePathPrefix={`/template/templates/${templateId}/`}
    title="Ungespeicherte Änderungen"
    message="Möchten Sie die Seite verlassen? Ihre Änderungen gehen verloren."
    confirmLabel="Verlassen"
    cancelLabel="Bleiben"
  />
  {/* fields… */}
</FormProvider>
```

**Any dirty source (Monaco buffer, custom hook, …):**

```tsx
import { UnsavedChangesGuard } from "@knkcs/anker/navigation";

<UnsavedChangesGuard
  isDirty={editor.hasAnyDirty}
  safePathPrefix={`/template/templates/${templateId}/`}
  title="Ungespeicherte Änderungen"
/>
```

> **Data-router requirement.** Both guards rely on
> `react-router-dom`'s `useBlocker`, which only works inside a data
> router (`createBrowserRouter` / `createMemoryRouter` +
> `<RouterProvider/>`). The legacy `<BrowserRouter>` / `<MemoryRouter>`
> JSX routers do not implement `useBlocker`.

## Advanced: primitive hook

If you need to build a non-dialog UX (e.g. a toast, an inline banner),
use the hook directly:

```tsx
import { useUnsavedChangesBlocker } from "@knkcs/anker/navigation";

const blocker = useUnsavedChangesBlocker(isDirty, {
  safePathPrefix: `/foo/bar/${id}/`,
});
// blocker.state === "blocked" | "proceeding" | "unblocked"
// blocker.proceed(), blocker.reset()
```
```

- [ ] **Step 2: Build storybook to verify**

Run: `npm run build-storybook`
Expected: builds clean; `Forms/Dirty surfaces` still appears in `storybook-static/index.json`.

- [ ] **Step 3: Commit**

```bash
git add src/forms/dirty-surfaces.mdx
git commit -m "docs(forms): expand dirty-surfaces to cover navigation guards"
```

---

### Task 10: Full verify

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Full test suite**

Run: `npm test`
Expected: all green (existing tests + 3 new for blocker + 4 new for guard + 3 new for tab-dirty + 3 new for DirtyFormGuard = 13 new cases).

- [ ] **Step 4: Build + verify-exports**

Run: `npm run build && npm run verify-exports`
Expected: clean; 8 tsup entries (was 7); `@knkcs/anker/navigation` resolves the four new exports.

- [ ] **Step 5: If anything failed, fix + commit**

Use project conventions to address failures. If you cannot fix, escalate as BLOCKED with the exact error.

```bash
git add -A
git commit -m "fix(navigation): address lint/typecheck/build feedback"
```

(Skip if everything passed on first run.)

---

### Task 11: Version bump + PR

**Files:**
- Modify: `package.json` (version)
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Bump version**

Edit `package.json`:

```json
"version": "2.8.0",
```

- [ ] **Step 2: Update changelog**

Prepend under a new heading:

```markdown
## 2.8.0 — 2026-05-29

### Added
- New `@knkcs/anker/navigation` namespace:
  - `useUnsavedChangesBlocker(isDirty, opts)` — primitive hook returning a
    react-router `Blocker`. Supports `safePathPrefix` to exempt sibling
    paths (e.g. tabs of the same detail page) and `shouldBlock` for
    arbitrary predicates.
  - `<UnsavedChangesGuard isDirty={…} …/>` — non-form-aware leave-page
    guard composing the hook with `<LeavePageConfirmation/>`.
  - `<TabDirtyProvider/>` + `useTabDirty()` — multi-key registry of
    per-tab dirty state. Use with `<DirtyDot/>` to surface unsaved work
    on tab triggers.
- `<DirtyFormGuard/>` now accepts `safePathPrefix` and `shouldBlock`.
  Existing callers without these props behave identically.

### Changed
- `<DirtyFormGuard/>` internally delegates to `<UnsavedChangesGuard/>`
  (transparent refactor; no API break).
- `Forms/Dirty surfaces` storybook page expanded to cover all five
  dirty surfaces (field visual, counter chip, tab dot, form guard,
  generic guard).

### Requirements
- The leave-page guards require a react-router-dom **data router**
  (`createBrowserRouter` / `createMemoryRouter` + `<RouterProvider/>`).
```

- [ ] **Step 3: Commit version bump**

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): 2.8.0"
```

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/unified-unsaved-changes-api
gh pr create --title "feat: unified unsaved-changes API (2.8.0)" --body "$(cat <<'EOF'
## Summary
- New `@knkcs/anker/navigation` namespace: `useUnsavedChangesBlocker`, `UnsavedChangesGuard`, `TabDirtyProvider`, `useTabDirty`.
- `DirtyFormGuard` accepts `safePathPrefix` / `shouldBlock` and internally delegates to `UnsavedChangesGuard`. Backwards-compat for existing callers.
- `Forms/Dirty surfaces` docs cover all five surfaces.
- Version bump 2.7.0 → 2.8.0, additive only.

Spec: `docs/superpowers/specs/2026-05-29-unified-unsaved-changes-api-design.md`.

## Test Plan
- [ ] `npm test` green (incl. 13 new tests)
- [ ] `npm run lint` / `typecheck` / `build` / `verify-exports` clean
- [ ] Storybook shows `Forms/Dirty surfaces` with the expanded matrix + snippets

## Adoption
Template service adopts in a follow-up PR (drops project-local `tab-dirty-context.tsx` + `template-detail-dirty-guard.tsx`).
EOF
)"
```

- [ ] **Step 5: After merge, tag + verify publish**

Once the PR merges, on `main`:

```bash
git checkout main
git pull
git tag v2.8.0
git push origin v2.8.0
```

Watch the publish workflow (`gh run watch <id>`). When green:

```bash
npm view @knkcs/anker@2.8.0 version
```

Expected output: `2.8.0`.

---

## Acceptance criteria check (from spec §9)

- [ ] `@knkcs/anker@2.8.0` published with `useUnsavedChangesBlocker`, `UnsavedChangesGuard`, `TabDirtyProvider`, `useTabDirty` exported from `@knkcs/anker/navigation`.
- [ ] `DirtyFormGuard` accepts `safePathPrefix` / `shouldBlock`; existing callers without those props behave identically.
- [ ] `Forms/Dirty surfaces` mdx covers all five surfaces with runnable snippets.
- [ ] vitest suite green; lint/typecheck/build/verify-exports clean.
