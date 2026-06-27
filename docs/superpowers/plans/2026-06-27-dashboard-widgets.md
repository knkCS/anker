# Dashboard & Widget Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a domain-free dashboard/widget framework in `@knkcs/anker/components` — a published widget contract plus a `react-grid-layout` engine, registry, catalog, config form, and chrome — so any knkCMS service can build dashboards from its own widgets.

**Architecture:** A new `src/components/dashboard/` composite. The app owns the saved `widgets` array and `mode` (controlled); anker owns the ephemeral edit-session draft via an internal `useDashboardDraft` hook, emitting `onCommit` on save and `onDraftChange` for observation. Widgets self-fetch their own data inside their `Component`. The grid wraps `react-grid-layout` as an optional peer dependency.

**Tech Stack:** React 18+, Chakra UI v3 (semantic tokens, primitives), lucide-react icons, `react-grid-layout` ^2.2.3 (optional peer dep), Vitest + Testing Library, tsup (ESM + d.ts), Biome.

## Global Constraints

- **Source of truth for design:** `docs/superpowers/specs/2026-06-27-dashboard-widgets-design.md`. Every decision there is binding.
- **No domain coupling:** no service imports, no API calls, no i18n keys. User-facing strings are props with English defaults (the `DashboardLabels` object). Icons are `React.ReactNode` (lucide). `category` is a free-form `string`.
- **Indentation is tabs** (Biome). Code blocks below use spaces for readability — run `npm run lint:write` before every commit to reformat.
- **Every exported component/function has `displayName`** where it is a component.
- **Semantic tokens only** (`bg-surface`, `bg-subtle`, `border`, `muted`, `subtle`, `bg-accent-muted`, …) — no hardcoded colors. Logical CSS props (`insetInlineEnd`, `paddingInline`) — no `right`/`ml`.
- **`react-grid-layout` version:** `^2.2.3` exactly (verified current stable 2026-06-27).
- **Test harness:** wrap rendered components in `<ChakraProvider value={defaultSystem}>` (Chakra default system — token names resolve to raw strings, which is fine for behavior tests). Use `screen` from `@testing-library/react` for queries (Drawer renders through a Portal).
- **Per-test run:** `npx vitest run src/components/dashboard/<file>.test.tsx`. Full suite: `npm run test`. Types: `npm run typecheck`. Lint: `npm run lint`.
- **All new files live in** `src/components/dashboard/`.

---

### Task 1: Contract types + labels

**Files:**
- Create: `src/components/dashboard/types.ts`
- Create: `src/components/dashboard/labels.ts`
- Test: `src/components/dashboard/labels.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: types `DashboardMode`, `WidgetSettingField`, `WidgetRenderProps<T>`, `WidgetConfigEditorProps<T>`, `WidgetSize`, `WidgetDefinition<T>`, `WidgetLayout`, `WidgetInstance`, `GridConfig`; interface `DashboardLabels`; const `defaultDashboardLabels: DashboardLabels`.

- [ ] **Step 1: Create `types.ts`**

```ts
import type React from "react";

export type DashboardMode = "view" | "edit";

export interface WidgetSettingField {
	key: string;
	label: string;
	type: "number" | "boolean" | "select" | "text";
	options?: Array<{ label: string; value: unknown }>;
	defaultValue?: unknown;
}

export interface WidgetRenderProps<TSettings = Record<string, unknown>> {
	id: string;
	settings: TSettings;
	mode: DashboardMode;
}

export interface WidgetConfigEditorProps<TSettings = Record<string, unknown>> {
	settings: TSettings;
	onChange: (next: TSettings) => void;
}

export interface WidgetSize {
	w: number;
	h: number;
}

export interface WidgetDefinition<TSettings = Record<string, unknown>> {
	type: string;
	name: string;
	description?: string;
	icon?: React.ReactNode;
	category?: string;
	minSize: WidgetSize;
	defaultSize: WidgetSize;
	maxSize?: WidgetSize;
	defaultSettings?: TSettings;
	settingsSchema?: WidgetSettingField[];
	requiredPermissions?: string[];
	isAvailable?: (ctx: unknown) => boolean;
	Component: React.FC<WidgetRenderProps<TSettings>>;
	ConfigEditor?: React.FC<WidgetConfigEditorProps<TSettings>>;
}

export interface WidgetLayout {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface WidgetInstance {
	id: string;
	type: string;
	settings: Record<string, unknown>;
	layout: WidgetLayout;
}

export interface GridConfig {
	cols?: number;
	rowHeight?: number;
	margin?: [number, number];
	containerPadding?: [number, number];
}
```

- [ ] **Step 2: Create `labels.ts`**

```ts
export interface DashboardLabels {
	edit: string;
	save: string;
	discard: string;
	addWidget: string;
	removeWidget: string;
	configureWidget: string;
	dragHandle: string;
	catalogTitle: string;
	configTitle: string;
	emptyHeader: string;
	emptyDescription: string;
	unknownWidget: string;
	noAccessWidget: string;
}

export const defaultDashboardLabels: DashboardLabels = {
	edit: "Edit",
	save: "Save",
	discard: "Discard",
	addWidget: "Add widget",
	removeWidget: "Remove widget",
	configureWidget: "Configure widget",
	dragHandle: "Drag to move",
	catalogTitle: "Add a widget",
	configTitle: "Configure widget",
	emptyHeader: "No widgets yet",
	emptyDescription: "Enter edit mode and add a widget to get started.",
	unknownWidget: "Unknown widget",
	noAccessWidget: "You don't have access to this widget.",
};
```

- [ ] **Step 3: Write the failing test `labels.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { defaultDashboardLabels } from "./labels";

describe("defaultDashboardLabels", () => {
	it("provides English defaults for key labels", () => {
		expect(defaultDashboardLabels.edit).toBe("Edit");
		expect(defaultDashboardLabels.save).toBe("Save");
		expect(defaultDashboardLabels.addWidget).toBe("Add widget");
		expect(defaultDashboardLabels.unknownWidget).toBe("Unknown widget");
	});
});
```

- [ ] **Step 4: Run the test and typecheck**

Run: `npx vitest run src/components/dashboard/labels.test.ts && npm run typecheck`
Expected: test PASS; typecheck clean.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint:write
git add src/components/dashboard/types.ts src/components/dashboard/labels.ts src/components/dashboard/labels.test.ts
git commit -m "feat(dashboard): widget contract types and default labels"
```

---

### Task 2: Widget registry

**Files:**
- Create: `src/components/dashboard/registry.ts`
- Test: `src/components/dashboard/registry.test.ts`

**Interfaces:**
- Consumes: `WidgetDefinition` from `./types`.
- Produces: `interface WidgetRegistry { get(type: string): WidgetDefinition | undefined; getAll(): WidgetDefinition[]; getCatalog(grantedPermissions?: string[], ctx?: unknown): WidgetDefinition[] }`; `createWidgetRegistry(definitions: WidgetDefinition[]): WidgetRegistry`; `isWidgetAvailable(def, grantedPermissions?, ctx?): boolean`.

- [ ] **Step 1: Write the failing test `registry.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { createWidgetRegistry, isWidgetAvailable } from "./registry";
import type { WidgetDefinition } from "./types";

const make = (over: Partial<WidgetDefinition>): WidgetDefinition => ({
	type: "t",
	name: "T",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	Component: () => null,
	...over,
});

describe("createWidgetRegistry", () => {
	it("get / getAll return registered definitions", () => {
		const a = make({ type: "a" });
		const b = make({ type: "b" });
		const reg = createWidgetRegistry([a, b]);
		expect(reg.get("a")).toBe(a);
		expect(reg.get("missing")).toBeUndefined();
		expect(reg.getAll()).toHaveLength(2);
	});

	it("getCatalog filters by required permission tokens", () => {
		const open = make({ type: "open" });
		const gated = make({ type: "gated", requiredPermissions: ["admin"] });
		const reg = createWidgetRegistry([open, gated]);
		expect(reg.getCatalog([]).map((d) => d.type)).toEqual(["open"]);
		expect(reg.getCatalog(["admin"]).map((d) => d.type)).toEqual(["open", "gated"]);
	});

	it("getCatalog honors the isAvailable predicate", () => {
		const def = make({ type: "flag", isAvailable: (ctx) => ctx === "on" });
		const reg = createWidgetRegistry([def]);
		expect(reg.getCatalog([], "off")).toHaveLength(0);
		expect(reg.getCatalog([], "on")).toHaveLength(1);
	});
});

describe("isWidgetAvailable", () => {
	it("requires all tokens and a non-false predicate", () => {
		const def = make({ requiredPermissions: ["a", "b"] });
		expect(isWidgetAvailable(def, ["a"])).toBe(false);
		expect(isWidgetAvailable(def, ["a", "b"])).toBe(true);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/dashboard/registry.test.ts`
Expected: FAIL with "Cannot find module './registry'".

- [ ] **Step 3: Create `registry.ts`**

```ts
import type { WidgetDefinition } from "./types";

export interface WidgetRegistry {
	get(type: string): WidgetDefinition | undefined;
	getAll(): WidgetDefinition[];
	getCatalog(grantedPermissions?: string[], ctx?: unknown): WidgetDefinition[];
}

export function isWidgetAvailable(
	def: WidgetDefinition,
	grantedPermissions?: string[],
	ctx?: unknown,
): boolean {
	const granted = grantedPermissions ?? [];
	const hasPerms =
		!def.requiredPermissions?.length ||
		def.requiredPermissions.every((t) => granted.includes(t));
	const predicateOk = def.isAvailable ? def.isAvailable(ctx) !== false : true;
	return hasPerms && predicateOk;
}

export function createWidgetRegistry(
	definitions: WidgetDefinition[],
): WidgetRegistry {
	const byType = new Map<string, WidgetDefinition>();
	for (const def of definitions) byType.set(def.type, def);
	return {
		get: (type) => byType.get(type),
		getAll: () => Array.from(byType.values()),
		getCatalog: (grantedPermissions, ctx) =>
			Array.from(byType.values()).filter((d) =>
				isWidgetAvailable(d, grantedPermissions, ctx),
			),
	};
}
```

- [ ] **Step 4: Run the test and typecheck**

Run: `npx vitest run src/components/dashboard/registry.test.ts && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint:write
git add src/components/dashboard/registry.ts src/components/dashboard/registry.test.ts
git commit -m "feat(dashboard): widget registry with availability filtering"
```

---

### Task 3: Settings resolution

**Files:**
- Create: `src/components/dashboard/resolve-settings.ts`
- Test: `src/components/dashboard/resolve-settings.test.ts`

**Interfaces:**
- Consumes: `WidgetDefinition`, `WidgetInstance` from `./types`.
- Produces: `resolveWidgetSettings(def: WidgetDefinition | undefined, instance: WidgetInstance): Record<string, unknown>` — `defaultSettings` merged under instance `settings`.

- [ ] **Step 1: Write the failing test `resolve-settings.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { resolveWidgetSettings } from "./resolve-settings";
import type { WidgetDefinition, WidgetInstance } from "./types";

const def = {
	type: "t",
	name: "T",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 1, h: 1 },
	defaultSettings: { limit: 5, show: true },
	Component: () => null,
} as WidgetDefinition;

const instance: WidgetInstance = {
	id: "1",
	type: "t",
	settings: { limit: 9 },
	layout: { x: 0, y: 0, w: 1, h: 1 },
};

describe("resolveWidgetSettings", () => {
	it("merges instance settings over definition defaults", () => {
		expect(resolveWidgetSettings(def, instance)).toEqual({ limit: 9, show: true });
	});
	it("returns instance settings when definition is undefined", () => {
		expect(resolveWidgetSettings(undefined, instance)).toEqual({ limit: 9 });
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/dashboard/resolve-settings.test.ts`
Expected: FAIL with "Cannot find module './resolve-settings'".

- [ ] **Step 3: Create `resolve-settings.ts`**

```ts
import type { WidgetDefinition, WidgetInstance } from "./types";

export function resolveWidgetSettings(
	def: WidgetDefinition | undefined,
	instance: WidgetInstance,
): Record<string, unknown> {
	return { ...(def?.defaultSettings ?? {}), ...(instance.settings ?? {}) };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/components/dashboard/resolve-settings.test.ts`
Expected: PASS.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint:write
git add src/components/dashboard/resolve-settings.ts src/components/dashboard/resolve-settings.test.ts
git commit -m "feat(dashboard): resolve widget settings against defaults"
```

---

### Task 4: Edit-session draft hook

**Files:**
- Create: `src/components/dashboard/use-dashboard-draft.ts`
- Test: `src/components/dashboard/use-dashboard-draft.test.tsx`

**Interfaces:**
- Consumes: `DashboardMode`, `WidgetDefinition`, `WidgetInstance` from `./types`.
- Produces:
  - `interface UseDashboardDraftArgs { widgets: WidgetInstance[]; mode: DashboardMode; generateId: () => string; onDraftChange?: (draft: WidgetInstance[]) => void }`
  - `interface DashboardDraft { items: WidgetInstance[]; isDirty: boolean; getDraft(): WidgetInstance[]; addWidget(def: WidgetDefinition): void; removeWidget(id: string): void; updateSettings(id: string, settings: Record<string, unknown>): void; updateLayouts(layouts: Array<{ i: string; x: number; y: number; w: number; h: number }>): void }`
  - `useDashboardDraft(args: UseDashboardDraftArgs): DashboardDraft`

Semantics: in `view` mode `items === widgets` and `isDirty === false`. Entering `edit` seeds an internal draft cloned from `widgets`; mutators operate on the draft; leaving `edit` drops the draft (revert). `isDirty` is a JSON comparison of draft vs `widgets`.

- [ ] **Step 1: Write the failing test `use-dashboard-draft.test.tsx`**

```tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { WidgetDefinition, WidgetInstance } from "./types";
import { useDashboardDraft } from "./use-dashboard-draft";

const widgets: WidgetInstance[] = [
	{ id: "a", type: "x", settings: {}, layout: { x: 0, y: 0, w: 2, h: 2 } },
];
const def = {
	type: "y",
	name: "Y",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 3, h: 2 },
	defaultSettings: { foo: 1 },
	Component: () => null,
} as WidgetDefinition;
const genId = () => "new";

describe("useDashboardDraft", () => {
	it("returns saved widgets and is not dirty in view mode", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "view", generateId: genId }),
		);
		expect(result.current.items).toEqual(widgets);
		expect(result.current.isDirty).toBe(false);
	});

	it("adds a widget to the draft in edit mode and marks dirty", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "edit", generateId: genId }),
		);
		act(() => result.current.addWidget(def));
		expect(result.current.items).toHaveLength(2);
		expect(result.current.items[1]).toMatchObject({
			id: "new",
			type: "y",
			settings: { foo: 1 },
		});
		expect(result.current.isDirty).toBe(true);
	});

	it("removes a widget from the draft", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "edit", generateId: genId }),
		);
		act(() => result.current.removeWidget("a"));
		expect(result.current.items).toHaveLength(0);
		expect(result.current.isDirty).toBe(true);
	});

	it("discards the draft when leaving edit mode", () => {
		const { result, rerender } = renderHook(
			({ mode }: { mode: "view" | "edit" }) =>
				useDashboardDraft({ widgets, mode, generateId: genId }),
			{ initialProps: { mode: "edit" } },
		);
		act(() => result.current.removeWidget("a"));
		expect(result.current.items).toHaveLength(0);
		rerender({ mode: "view" });
		expect(result.current.items).toEqual(widgets);
		expect(result.current.isDirty).toBe(false);
	});

	it("updateSettings replaces an instance's settings", () => {
		const { result } = renderHook(() =>
			useDashboardDraft({ widgets, mode: "edit", generateId: genId }),
		);
		act(() => result.current.updateSettings("a", { hello: "world" }));
		expect(result.current.getDraft()[0].settings).toEqual({ hello: "world" });
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/dashboard/use-dashboard-draft.test.tsx`
Expected: FAIL with "Cannot find module './use-dashboard-draft'".

- [ ] **Step 3: Create `use-dashboard-draft.ts`**

```ts
import { useEffect, useRef, useState } from "react";
import type { DashboardMode, WidgetDefinition, WidgetInstance } from "./types";

export interface UseDashboardDraftArgs {
	widgets: WidgetInstance[];
	mode: DashboardMode;
	generateId: () => string;
	onDraftChange?: (draft: WidgetInstance[]) => void;
}

export interface DashboardDraft {
	items: WidgetInstance[];
	isDirty: boolean;
	getDraft(): WidgetInstance[];
	addWidget(def: WidgetDefinition): void;
	removeWidget(id: string): void;
	updateSettings(id: string, settings: Record<string, unknown>): void;
	updateLayouts(
		layouts: Array<{ i: string; x: number; y: number; w: number; h: number }>,
	): void;
}

function clone(widgets: WidgetInstance[]): WidgetInstance[] {
	return widgets.map((w) => ({
		...w,
		settings: { ...w.settings },
		layout: { ...w.layout },
	}));
}

function nextY(items: WidgetInstance[]): number {
	return items.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0);
}

export function useDashboardDraft({
	widgets,
	mode,
	generateId,
	onDraftChange,
}: UseDashboardDraftArgs): DashboardDraft {
	const [draft, setDraft] = useState<WidgetInstance[] | null>(null);
	// Initialize to "view" (not `mode`) so mounting directly in edit mode still
	// triggers the seed branch on the first effect run.
	const prevMode = useRef<DashboardMode>("view");

	useEffect(() => {
		if (mode === "edit" && prevMode.current !== "edit") {
			setDraft(clone(widgets));
		} else if (mode !== "edit") {
			setDraft(null);
		}
		prevMode.current = mode;
	}, [mode, widgets]);

	const editing = mode === "edit" && draft !== null;
	const items = editing ? (draft as WidgetInstance[]) : widgets;
	const isDirty = editing
		? JSON.stringify(draft) !== JSON.stringify(widgets)
		: false;

	const commit = (next: WidgetInstance[]) => {
		setDraft(next);
		onDraftChange?.(next);
	};

	return {
		items,
		isDirty,
		getDraft: () => draft ?? widgets,
		addWidget: (def) => {
			const base = draft ?? widgets;
			const instance: WidgetInstance = {
				id: generateId(),
				type: def.type,
				settings: { ...(def.defaultSettings ?? {}) },
				layout: {
					x: 0,
					y: nextY(base),
					w: def.defaultSize.w,
					h: def.defaultSize.h,
				},
			};
			commit([...base, instance]);
		},
		removeWidget: (id) => commit((draft ?? widgets).filter((w) => w.id !== id)),
		updateSettings: (id, settings) =>
			commit(
				(draft ?? widgets).map((w) => (w.id === id ? { ...w, settings } : w)),
			),
		updateLayouts: (layouts) => {
			const byId = new Map(layouts.map((l) => [l.i, l]));
			commit(
				(draft ?? widgets).map((w) => {
					const l = byId.get(w.id);
					return l
						? { ...w, layout: { x: l.x, y: l.y, w: l.w, h: l.h } }
						: w;
				}),
			);
		},
	};
}
```

- [ ] **Step 4: Run the test and typecheck**

Run: `npx vitest run src/components/dashboard/use-dashboard-draft.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint:write
git add src/components/dashboard/use-dashboard-draft.ts src/components/dashboard/use-dashboard-draft.test.tsx
git commit -m "feat(dashboard): edit-session draft hook (add/remove/settings/layout/dirty)"
```

---

### Task 5: WidgetConfigForm

**Files:**
- Create: `src/components/dashboard/widget-config-form.tsx`
- Test: `src/components/dashboard/widget-config-form.test.tsx`

**Interfaces:**
- Consumes: `WidgetSettingField` from `./types`; `NativeSelect` from `../../primitives/native-select`; `Switch` from `../../primitives/switch`; `Stack` from `../../primitives/layout`; `Text` from `../../primitives/typography`; `Input` from `@chakra-ui/react` (no primitive wrapper exists, so a direct import is allowed — `widget.tsx` and `fact-box.tsx` import Chakra directly too).
- Produces: `interface WidgetConfigFormProps { schema: WidgetSettingField[]; settings: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void }`; `WidgetConfigForm: React.FC<WidgetConfigFormProps>`. Controlled — every change emits the full merged settings object.

- [ ] **Step 1: Write the failing test `widget-config-form.test.tsx`**

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WidgetSettingField } from "./types";
import { WidgetConfigForm } from "./widget-config-form";

const schema: WidgetSettingField[] = [
	{ key: "label", label: "Label", type: "text", defaultValue: "Items" },
	{ key: "count", label: "Count", type: "number", defaultValue: 5 },
	{ key: "show", label: "Show", type: "boolean", defaultValue: true },
];

function setup(
	onChange = vi.fn(),
	settings: Record<string, unknown> = {},
) {
	render(
		<ChakraProvider value={defaultSystem}>
			<WidgetConfigForm schema={schema} settings={settings} onChange={onChange} />
		</ChakraProvider>,
	);
	return { onChange };
}

describe("WidgetConfigForm", () => {
	it("renders a control per schema field", () => {
		setup();
		expect(screen.getByLabelText("Label")).toBeInTheDocument();
		expect(screen.getByLabelText("Count")).toBeInTheDocument();
		expect(screen.getByLabelText("Show")).toBeInTheDocument();
	});

	it("emits merged settings when a text field changes", () => {
		const { onChange } = setup(vi.fn(), { label: "A", count: 5 });
		fireEvent.change(screen.getByLabelText("Label"), {
			target: { value: "B" },
		});
		expect(onChange).toHaveBeenCalledWith({ label: "B", count: 5 });
	});

	it("coerces number fields to numbers", () => {
		const { onChange } = setup(vi.fn(), { count: 5 });
		fireEvent.change(screen.getByLabelText("Count"), {
			target: { value: "8" },
		});
		expect(onChange).toHaveBeenCalledWith({ count: 8 });
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/dashboard/widget-config-form.test.tsx`
Expected: FAIL with "Cannot find module './widget-config-form'".

- [ ] **Step 3: Create `widget-config-form.tsx`**

```tsx
import { Input } from "@chakra-ui/react";
import type React from "react";
import { Stack } from "../../primitives/layout";
import { NativeSelect } from "../../primitives/native-select";
import { Switch } from "../../primitives/switch";
import { Text } from "../../primitives/typography";
import type { WidgetSettingField } from "./types";

export interface WidgetConfigFormProps {
	schema: WidgetSettingField[];
	settings: Record<string, unknown>;
	onChange: (next: Record<string, unknown>) => void;
}

export const WidgetConfigForm: React.FC<WidgetConfigFormProps> = ({
	schema,
	settings,
	onChange,
}) => {
	const set = (key: string, value: unknown) =>
		onChange({ ...settings, [key]: value });

	return (
		<Stack gap={4}>
			{schema.map((field) => {
				const value = settings[field.key] ?? field.defaultValue;
				return (
					<Stack key={field.key} gap={1}>
						<Text fontSize="sm" fontWeight="medium">
							{field.label}
						</Text>
						{field.type === "boolean" ? (
							<Switch
								checked={Boolean(value)}
								onCheckedChange={(e) => set(field.key, e.checked)}
								inputProps={{ "aria-label": field.label }}
							/>
						) : field.type === "select" ? (
							<NativeSelect
								aria-label={field.label}
								value={String(value ?? "")}
								onChange={(e) => {
									const opt = field.options?.find(
										(o) => String(o.value) === e.target.value,
									);
									set(field.key, opt ? opt.value : e.target.value);
								}}
							>
								{field.options?.map((o) => (
									<option key={String(o.value)} value={String(o.value)}>
										{o.label}
									</option>
								))}
							</NativeSelect>
						) : field.type === "number" ? (
							<Input
								type="number"
								aria-label={field.label}
								value={
									value === undefined || value === null ? "" : String(value)
								}
								onChange={(e) =>
									set(
										field.key,
										e.target.value === "" ? undefined : Number(e.target.value),
									)
								}
							/>
						) : (
							<Input
								aria-label={field.label}
								value={
									value === undefined || value === null ? "" : String(value)
								}
								onChange={(e) => set(field.key, e.target.value)}
							/>
						)}
					</Stack>
				);
			})}
		</Stack>
	);
};
WidgetConfigForm.displayName = "WidgetConfigForm";
```

- [ ] **Step 4: Run the test and typecheck**

Run: `npx vitest run src/components/dashboard/widget-config-form.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint:write
git add src/components/dashboard/widget-config-form.tsx src/components/dashboard/widget-config-form.test.tsx
git commit -m "feat(dashboard): schema-driven widget config form"
```

---

### Task 6: WidgetCatalog

**Files:**
- Create: `src/components/dashboard/widget-catalog.tsx`
- Test: `src/components/dashboard/widget-catalog.test.tsx`

**Interfaces:**
- Consumes: `WidgetDefinition` from `./types`; `DrawerRoot` from `../drawer`; `Box`, `HStack`, `Stack` from `../../primitives/layout`; `Text` from `../../primitives/typography`.
- Produces: `interface WidgetCatalogProps { open: boolean; onClose: () => void; definitions: WidgetDefinition[]; onSelect: (def: WidgetDefinition) => void; title?: string }`; `WidgetCatalog: React.FC<WidgetCatalogProps>`. Groups `definitions` by `category` (fallback `"Other"`); each entry is a `<button>` labelled with the definition name; clicking calls `onSelect(def)` then `onClose()`.

- [ ] **Step 1: Write the failing test `widget-catalog.test.tsx`**

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WidgetDefinition } from "./types";
import { WidgetCatalog } from "./widget-catalog";

const defs: WidgetDefinition[] = [
	{
		type: "a",
		name: "Alpha",
		category: "Metrics",
		description: "first",
		minSize: { w: 1, h: 1 },
		defaultSize: { w: 2, h: 2 },
		Component: () => null,
	},
	{
		type: "b",
		name: "Beta",
		category: "General",
		minSize: { w: 1, h: 1 },
		defaultSize: { w: 2, h: 2 },
		Component: () => null,
	},
];

function setup(onSelect = vi.fn(), onClose = vi.fn()) {
	render(
		<ChakraProvider value={defaultSystem}>
			<WidgetCatalog open onClose={onClose} definitions={defs} onSelect={onSelect} />
		</ChakraProvider>,
	);
	return { onSelect, onClose };
}

describe("WidgetCatalog", () => {
	it("renders an entry per definition", () => {
		setup();
		expect(screen.getByLabelText("Alpha")).toBeInTheDocument();
		expect(screen.getByLabelText("Beta")).toBeInTheDocument();
	});

	it("calls onSelect and onClose when an entry is clicked", () => {
		const { onSelect, onClose } = setup();
		fireEvent.click(screen.getByLabelText("Alpha"));
		expect(onSelect).toHaveBeenCalledWith(defs[0]);
		expect(onClose).toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/dashboard/widget-catalog.test.tsx`
Expected: FAIL with "Cannot find module './widget-catalog'".

- [ ] **Step 3: Create `widget-catalog.tsx`**

```tsx
import type React from "react";
import { Box, HStack, Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { DrawerRoot } from "../drawer";
import type { WidgetDefinition } from "./types";

export interface WidgetCatalogProps {
	open: boolean;
	onClose: () => void;
	definitions: WidgetDefinition[];
	onSelect: (def: WidgetDefinition) => void;
	title?: string;
}

export const WidgetCatalog: React.FC<WidgetCatalogProps> = ({
	open,
	onClose,
	definitions,
	onSelect,
	title = "Add a widget",
}) => {
	const groups = new Map<string, WidgetDefinition[]>();
	for (const def of definitions) {
		const key = def.category ?? "Other";
		const list = groups.get(key) ?? [];
		list.push(def);
		groups.set(key, list);
	}

	return (
		<DrawerRoot open={open} onClose={onClose} title={title}>
			<Stack gap={6}>
				{Array.from(groups.entries()).map(([category, defs]) => (
					<Stack key={category} gap={2}>
						<Text
							fontSize="xs"
							fontWeight="semibold"
							color="muted"
							textTransform="uppercase"
						>
							{category}
						</Text>
						{defs.map((def) => (
							<Box
								as="button"
								key={def.type}
								type="button"
								textAlign="start"
								width="full"
								borderWidth="1px"
								borderColor="border"
								borderRadius="md"
								padding={3}
								bg="bg-surface"
								_hover={{ bg: "bg-subtle" }}
								onClick={() => {
									onSelect(def);
									onClose();
								}}
								aria-label={def.name}
							>
								<HStack gap={3} align="start">
									<Box color="subtle">{def.icon}</Box>
									<Stack gap={0}>
										<Text fontWeight="medium" fontSize="sm">
											{def.name}
										</Text>
										{def.description && (
											<Text fontSize="xs" color="muted">
												{def.description}
											</Text>
										)}
									</Stack>
								</HStack>
							</Box>
						))}
					</Stack>
				))}
			</Stack>
		</DrawerRoot>
	);
};
WidgetCatalog.displayName = "WidgetCatalog";
```

- [ ] **Step 4: Run the test and typecheck**

Run: `npx vitest run src/components/dashboard/widget-catalog.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean. (If `HStack` is not exported from `../../primitives/layout`, confirm its export name there — `fact-box.tsx` imports `HStack` from `../primitives/layout`, so it exists.)

- [ ] **Step 5: Lint and commit**

```bash
npm run lint:write
git add src/components/dashboard/widget-catalog.tsx src/components/dashboard/widget-catalog.test.tsx
git commit -m "feat(dashboard): widget catalog picker grouped by category"
```

---

### Task 7: WidgetFrame

**Files:**
- Create: `src/components/dashboard/widget-frame.tsx`
- Test: `src/components/dashboard/widget-frame.test.tsx`

**Interfaces:**
- Consumes: `IconButton` from `../../atoms/button`; `Box`, `Flex`, `HStack` from `../../primitives/layout`; `Text` from `../../primitives/typography`; `Widget` from `../widget`; `resolveWidgetSettings` from `./resolve-settings`; `DashboardLabels` from `./labels`; `DashboardMode`, `WidgetDefinition`, `WidgetInstance` from `./types`; icons `GripVertical`, `Settings`, `X` from `lucide-react`.
- Produces: `interface WidgetFrameProps { definition?: WidgetDefinition; instance: WidgetInstance; mode: DashboardMode; labels: DashboardLabels; onConfigure?: (id: string) => void; onRemove?: (id: string) => void }`; `WidgetFrame: React.FC<WidgetFrameProps>`.

Behavior: renders the existing `Widget` card (header = `definition.name` + `definition.icon`) wrapping `definition.Component`. In `edit` mode an overlay strip carries a drag handle (`className="rgl-drag-handle"`), and — wrapped in `className="rgl-no-drag"` with `onMouseDown` stopped — a config gear (only when `settingsSchema?.length` or `ConfigEditor`) and a remove button. When `definition` is undefined, renders an `unknownWidget` placeholder (still removable in edit mode).

- [ ] **Step 1: Write the failing test `widget-frame.test.tsx`**

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { defaultDashboardLabels } from "./labels";
import type { WidgetDefinition, WidgetInstance } from "./types";
import { WidgetFrame } from "./widget-frame";

const def: WidgetDefinition = {
	type: "stat",
	name: "Stat",
	icon: null,
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	settingsSchema: [{ key: "v", label: "V", type: "number", defaultValue: 1 }],
	defaultSettings: { v: 1 },
	Component: ({ settings }) => <span>val:{String(settings.v)}</span>,
};
const instance: WidgetInstance = {
	id: "1",
	type: "stat",
	settings: { v: 7 },
	layout: { x: 0, y: 0, w: 2, h: 2 },
};

const renderFrame = (
	props: Partial<React.ComponentProps<typeof WidgetFrame>> = {},
) =>
	render(
		<ChakraProvider value={defaultSystem}>
			<WidgetFrame
				definition={def}
				instance={instance}
				mode="view"
				labels={defaultDashboardLabels}
				{...props}
			/>
		</ChakraProvider>,
	);

describe("WidgetFrame", () => {
	it("renders the name and resolved body in view mode", () => {
		renderFrame();
		expect(screen.getByText("Stat")).toBeInTheDocument();
		expect(screen.getByText("val:7")).toBeInTheDocument();
	});

	it("shows configure and remove controls in edit mode", () => {
		renderFrame({ mode: "edit" });
		expect(
			screen.getByLabelText(defaultDashboardLabels.configureWidget),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText(defaultDashboardLabels.removeWidget),
		).toBeInTheDocument();
	});

	it("renders an unknown-widget placeholder when no definition matches", () => {
		render(
			<ChakraProvider value={defaultSystem}>
				<WidgetFrame
					instance={{ ...instance, type: "ghost" }}
					mode="view"
					labels={defaultDashboardLabels}
				/>
			</ChakraProvider>,
		);
		expect(
			screen.getByText(defaultDashboardLabels.unknownWidget),
		).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/dashboard/widget-frame.test.tsx`
Expected: FAIL with "Cannot find module './widget-frame'".

- [ ] **Step 3: Create `widget-frame.tsx`**

```tsx
import { GripVertical, Settings, X } from "lucide-react";
import type React from "react";
import { IconButton } from "../../atoms/button";
import { Box, Flex, HStack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { Widget } from "../widget";
import type { DashboardLabels } from "./labels";
import { resolveWidgetSettings } from "./resolve-settings";
import type {
	DashboardMode,
	WidgetDefinition,
	WidgetInstance,
} from "./types";

export interface WidgetFrameProps {
	definition?: WidgetDefinition;
	instance: WidgetInstance;
	mode: DashboardMode;
	labels: DashboardLabels;
	onConfigure?: (id: string) => void;
	onRemove?: (id: string) => void;
}

export const WidgetFrame: React.FC<WidgetFrameProps> = ({
	definition,
	instance,
	mode,
	labels,
	onConfigure,
	onRemove,
}) => {
	const editing = mode === "edit";
	const configurable =
		!!definition &&
		(!!definition.settingsSchema?.length || !!definition.ConfigEditor);

	return (
		<Box position="relative" height="100%">
			{editing && (
				<Flex
					className="rgl-drag-handle"
					align="center"
					justify="space-between"
					cursor="grab"
					bg="bg-subtle"
					borderBottom="1px solid"
					borderColor="border"
					paddingInline={2}
					paddingBlock={1}
				>
					<Box color="subtle" aria-label={labels.dragHandle}>
						<GripVertical size={16} aria-hidden />
					</Box>
					<HStack
						className="rgl-no-drag"
						onMouseDown={(e) => e.stopPropagation()}
					>
						{configurable && (
							<IconButton
								size="sm"
								variant="ghost"
								aria-label={labels.configureWidget}
								onClick={() => onConfigure?.(instance.id)}
							>
								<Settings size={16} />
							</IconButton>
						)}
						<IconButton
							size="sm"
							variant="ghost"
							aria-label={labels.removeWidget}
							onClick={() => onRemove?.(instance.id)}
						>
							<X size={16} />
						</IconButton>
					</HStack>
				</Flex>
			)}

			{definition ? (
				<Widget heading={definition.name} icon={definition.icon}>
					<definition.Component
						id={instance.id}
						settings={resolveWidgetSettings(definition, instance)}
						mode={mode}
					/>
				</Widget>
			) : (
				<Widget heading={labels.unknownWidget} icon={null}>
					<Text fontSize="sm" color="muted">
						{instance.type}
					</Text>
				</Widget>
			)}
		</Box>
	);
};
WidgetFrame.displayName = "WidgetFrame";
```

- [ ] **Step 4: Run the test and typecheck**

Run: `npx vitest run src/components/dashboard/widget-frame.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint:write
git add src/components/dashboard/widget-frame.tsx src/components/dashboard/widget-frame.test.tsx
git commit -m "feat(dashboard): per-widget frame with edit affordances + unknown fallback"
```

---

### Task 8: DashboardToolbar

**Files:**
- Create: `src/components/dashboard/dashboard-toolbar.tsx`
- Test: `src/components/dashboard/dashboard-toolbar.test.tsx`

**Interfaces:**
- Consumes: `Button` from `../../atoms/button`; `Flex`, `Spacer` from `../../primitives/layout`; `DashboardLabels` from `./labels`; `DashboardMode` from `./types`; icons `Pencil`, `Plus` from `lucide-react`.
- Produces: `interface DashboardToolbarProps { mode: DashboardMode; isDirty: boolean; labels: DashboardLabels; onEdit: () => void; onAddWidget: () => void; onSave: () => void; onDiscard: () => void }`; `DashboardToolbar: React.FC<DashboardToolbarProps>`. View mode shows Edit; edit mode shows Add/Discard/Save with Save disabled until `isDirty`.

- [ ] **Step 1: Write the failing test `dashboard-toolbar.test.tsx`**

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { DashboardToolbar } from "./dashboard-toolbar";
import { defaultDashboardLabels } from "./labels";

function setup(
	props: Partial<React.ComponentProps<typeof DashboardToolbar>> = {},
) {
	const handlers = {
		onEdit: vi.fn(),
		onAddWidget: vi.fn(),
		onSave: vi.fn(),
		onDiscard: vi.fn(),
	};
	render(
		<ChakraProvider value={defaultSystem}>
			<DashboardToolbar
				mode="view"
				isDirty={false}
				labels={defaultDashboardLabels}
				{...handlers}
				{...props}
			/>
		</ChakraProvider>,
	);
	return handlers;
}

describe("DashboardToolbar", () => {
	it("shows Edit in view mode and triggers onEdit", () => {
		const h = setup();
		fireEvent.click(screen.getByText(defaultDashboardLabels.edit));
		expect(h.onEdit).toHaveBeenCalled();
	});

	it("shows Add/Discard/Save in edit mode", () => {
		setup({ mode: "edit" });
		expect(
			screen.getByText(defaultDashboardLabels.addWidget),
		).toBeInTheDocument();
		expect(
			screen.getByText(defaultDashboardLabels.discard),
		).toBeInTheDocument();
		expect(screen.getByText(defaultDashboardLabels.save)).toBeInTheDocument();
	});

	it("does not fire onSave while not dirty", () => {
		const h = setup({ mode: "edit", isDirty: false });
		fireEvent.click(screen.getByText(defaultDashboardLabels.save));
		expect(h.onSave).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/dashboard/dashboard-toolbar.test.tsx`
Expected: FAIL with "Cannot find module './dashboard-toolbar'".

- [ ] **Step 3: Create `dashboard-toolbar.tsx`**

```tsx
import { Pencil, Plus } from "lucide-react";
import type React from "react";
import { Button } from "../../atoms/button";
import { Flex, Spacer } from "../../primitives/layout";
import type { DashboardLabels } from "./labels";
import type { DashboardMode } from "./types";

export interface DashboardToolbarProps {
	mode: DashboardMode;
	isDirty: boolean;
	labels: DashboardLabels;
	onEdit: () => void;
	onAddWidget: () => void;
	onSave: () => void;
	onDiscard: () => void;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
	mode,
	isDirty,
	labels,
	onEdit,
	onAddWidget,
	onSave,
	onDiscard,
}) => {
	return (
		<Flex align="center" gap={2} paddingBlockEnd={4}>
			<Spacer />
			{mode === "view" ? (
				<Button variant="outline" size="sm" onClick={onEdit}>
					<Pencil size={16} /> {labels.edit}
				</Button>
			) : (
				<>
					<Button variant="outline" size="sm" onClick={onAddWidget}>
						<Plus size={16} /> {labels.addWidget}
					</Button>
					<Button variant="ghost" size="sm" onClick={onDiscard}>
						{labels.discard}
					</Button>
					<Button
						variant="solid"
						size="sm"
						onClick={onSave}
						disabled={!isDirty}
					>
						{labels.save}
					</Button>
				</>
			)}
		</Flex>
	);
};
DashboardToolbar.displayName = "DashboardToolbar";
```

- [ ] **Step 4: Run the test and typecheck**

Run: `npx vitest run src/components/dashboard/dashboard-toolbar.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint:write
git add src/components/dashboard/dashboard-toolbar.tsx src/components/dashboard/dashboard-toolbar.test.tsx
git commit -m "feat(dashboard): edit/save/discard/add toolbar"
```

---

### Task 9: Dashboard grid engine (+ react-grid-layout dependency)

This task introduces the `react-grid-layout` dependency, so its install + packaging config live here (the deliverable needs them).

**Files:**
- Modify: `package.json` (add `react-grid-layout` to `peerDependencies` + `peerDependenciesMeta` + `devDependencies`)
- Modify: `tsup.config.ts:18-28` (add `"react-grid-layout"` to `external`)
- Modify: `src/test/setup.ts` (append `ResizeObserver` + `matchMedia` polyfills for jsdom)
- Create: `src/components/dashboard/dashboard.tsx`
- Test: `src/components/dashboard/dashboard.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–8 (`useDashboardDraft`, `WidgetRegistry`, `WidgetFrame`, `WidgetCatalog`, `WidgetConfigForm`, `DashboardToolbar`, `resolveWidgetSettings`, `defaultDashboardLabels`, types); `EmptyState` from `../../atoms/empty-state`; `Box` from `../../primitives/layout`; `DrawerRoot` from `../drawer`; `GridLayout`, `WidthProvider` from `react-grid-layout`.
- Produces: `interface DashboardProps {...}` (full shape below); `Dashboard: React.FC<DashboardProps>`.

- [ ] **Step 1: Install `react-grid-layout` and wire packaging**

```bash
npm install --save-dev react-grid-layout@^2.2.3
npm run typecheck
```

If typecheck reports missing types for `react-grid-layout`, also run `npm install --save-dev @types/react-grid-layout` (some 2.x builds bundle their own types — only add `@types` if the bundled ones are absent).

Then edit `package.json`. Add to `peerDependencies` (keep alphabetical):

```json
"react-grid-layout": "^2.2.3",
```

Add a new top-level `peerDependenciesMeta` block (or extend it if present):

```json
"peerDependenciesMeta": {
  "react-grid-layout": { "optional": true }
},
```

(The `devDependencies` entry was added by the install above so Storybook/tests/build resolve it.)

- [ ] **Step 2: Add `react-grid-layout` to tsup externals**

In `tsup.config.ts`, add `"react-grid-layout"` to the `external` array so consumers' bundlers resolve it instead of anker bundling it:

```ts
	external: [
		"react",
		"react-dom",
		"@chakra-ui/react",
		"react-hook-form",
		"@hookform/resolvers",
		"zod",
		"react-router-dom",
		"react-i18next",
		"@tanstack/react-table",
		"react-grid-layout",
	],
```

- [ ] **Step 3: Append jsdom polyfills to `src/test/setup.ts`**

`react-grid-layout`'s width provider needs `ResizeObserver` and `matchMedia`, which jsdom lacks. Append (guarded so it is harmless if already defined):

```ts
// react-grid-layout needs these in jsdom
if (!("ResizeObserver" in globalThis)) {
	(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
if (typeof window !== "undefined" && !window.matchMedia) {
	window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener() {},
		removeListener() {},
		addEventListener() {},
		removeEventListener() {},
		dispatchEvent() {
			return false;
		},
	})) as unknown as typeof window.matchMedia;
}
```

- [ ] **Step 4: Write the failing test `dashboard.test.tsx`**

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { Dashboard } from "./dashboard";
import { defaultDashboardLabels } from "./labels";
import { createWidgetRegistry } from "./registry";
import type { WidgetDefinition, WidgetInstance } from "./types";

const stat: WidgetDefinition = {
	type: "stat",
	name: "Stat",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	Component: ({ settings }) => <span>stat:{String(settings.value ?? 0)}</span>,
};
const note: WidgetDefinition = {
	type: "note",
	name: "Note",
	minSize: { w: 1, h: 1 },
	defaultSize: { w: 2, h: 2 },
	Component: () => <span>note-body</span>,
};
const registry = createWidgetRegistry([stat, note]);

const seed: WidgetInstance[] = [
	{ id: "a", type: "stat", settings: { value: 3 }, layout: { x: 0, y: 0, w: 2, h: 2 } },
	{ id: "b", type: "note", settings: {}, layout: { x: 2, y: 0, w: 2, h: 2 } },
];

const wrap = (ui: React.ReactNode) =>
	render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);

describe("Dashboard", () => {
	it("renders each widget body in view mode", () => {
		wrap(<Dashboard registry={registry} widgets={seed} />);
		expect(screen.getByText("stat:3")).toBeInTheDocument();
		expect(screen.getByText("note-body")).toBeInTheDocument();
	});

	it("renders the empty state when there are no widgets", () => {
		wrap(<Dashboard registry={registry} widgets={[]} />);
		expect(
			screen.getByText(defaultDashboardLabels.emptyHeader),
		).toBeInTheDocument();
	});

	it("renders an unknown-widget placeholder without crashing", () => {
		wrap(
			<Dashboard
				registry={registry}
				widgets={[
					{ id: "x", type: "ghost", settings: {}, layout: { x: 0, y: 0, w: 2, h: 2 } },
				]}
			/>,
		);
		expect(
			screen.getByText(defaultDashboardLabels.unknownWidget),
		).toBeInTheDocument();
	});

	it("commits the edited draft on Save", () => {
		const onCommit = vi.fn();
		const onModeChange = vi.fn();
		wrap(
			<Dashboard
				registry={registry}
				widgets={seed}
				mode="edit"
				onCommit={onCommit}
				onModeChange={onModeChange}
			/>,
		);
		fireEvent.click(
			screen.getAllByLabelText(defaultDashboardLabels.removeWidget)[0],
		);
		fireEvent.click(screen.getByText(defaultDashboardLabels.save));
		expect(onCommit).toHaveBeenCalledTimes(1);
		expect(onCommit.mock.calls[0][0]).toHaveLength(1);
		expect(onModeChange).toHaveBeenCalledWith("view");
	});
});
```

- [ ] **Step 5: Run to verify it fails**

Run: `npx vitest run src/components/dashboard/dashboard.test.tsx`
Expected: FAIL with "Cannot find module './dashboard'".

- [ ] **Step 6: Create `dashboard.tsx`**

```tsx
import { useMemo, useState } from "react";
import type React from "react";
import GridLayout, { WidthProvider } from "react-grid-layout";
import { EmptyState } from "../../atoms/empty-state";
import { Box } from "../../primitives/layout";
import { DrawerRoot } from "../drawer";
import { DashboardToolbar } from "./dashboard-toolbar";
import { type DashboardLabels, defaultDashboardLabels } from "./labels";
import type { WidgetRegistry } from "./registry";
import { resolveWidgetSettings } from "./resolve-settings";
import type {
	DashboardMode,
	GridConfig,
	WidgetDefinition,
	WidgetInstance,
} from "./types";
import { useDashboardDraft } from "./use-dashboard-draft";
import { WidgetCatalog } from "./widget-catalog";
import { WidgetConfigForm } from "./widget-config-form";
import { WidgetFrame } from "./widget-frame";

const ReactGridLayout = WidthProvider(GridLayout);

const DEFAULT_GRID: Required<GridConfig> = {
	cols: 12,
	rowHeight: 90,
	margin: [16, 16],
	containerPadding: [0, 0],
};

const GRID_CSS = {
	"& .react-grid-layout": {
		position: "relative",
		transition: "height 200ms ease",
	},
	"& .react-grid-item": {
		transition: "transform 200ms ease, width 200ms ease, height 200ms ease",
	},
	"& .react-grid-item.react-grid-placeholder": {
		background: "bg-accent-muted",
		borderRadius: "md",
		opacity: 0.4,
	},
	"& .react-grid-item > .react-resizable-handle": {
		position: "absolute",
		width: "20px",
		height: "20px",
		insetInlineEnd: 0,
		insetBlockEnd: 0,
		cursor: "se-resize",
	},
	"& .react-grid-item > .react-resizable-handle::after": {
		content: '""',
		position: "absolute",
		insetInlineEnd: "3px",
		insetBlockEnd: "3px",
		width: "6px",
		height: "6px",
		borderInlineEnd: "2px solid",
		borderBlockEnd: "2px solid",
		borderColor: "border",
	},
} as const;

let uidCounter = 0;
const defaultGenerateId = () =>
	`w-${Date.now().toString(36)}-${(uidCounter++).toString(36)}`;

export interface DashboardProps {
	registry: WidgetRegistry;
	widgets: WidgetInstance[];
	mode?: DashboardMode;
	grantedPermissions?: string[];
	availabilityContext?: unknown;
	grid?: GridConfig;
	onModeChange?: (mode: DashboardMode) => void;
	onCommit?: (widgets: WidgetInstance[]) => void;
	onDiscard?: () => void;
	onDraftChange?: (draft: WidgetInstance[]) => void;
	toolbar?: boolean;
	labels?: Partial<DashboardLabels>;
	emptyState?: React.ReactNode;
	generateId?: () => string;
}

const ConfigDrawer: React.FC<{
	title: string;
	saveLabel: string;
	def: WidgetDefinition;
	instance: WidgetInstance;
	onClose: () => void;
	onSave: (settings: Record<string, unknown>) => void;
}> = ({ title, saveLabel, def, instance, onClose, onSave }) => {
	const [settings, setSettings] = useState<Record<string, unknown>>(() =>
		resolveWidgetSettings(def, instance),
	);
	return (
		<DrawerRoot
			open
			onClose={onClose}
			title={title}
			saveLabel={saveLabel}
			onSave={() => onSave(settings)}
		>
			{def.ConfigEditor ? (
				<def.ConfigEditor settings={settings} onChange={setSettings} />
			) : (
				<WidgetConfigForm
					schema={def.settingsSchema ?? []}
					settings={settings}
					onChange={setSettings}
				/>
			)}
		</DrawerRoot>
	);
};
ConfigDrawer.displayName = "ConfigDrawer";

export const Dashboard: React.FC<DashboardProps> = ({
	registry,
	widgets,
	mode = "view",
	grantedPermissions,
	availabilityContext,
	grid,
	onModeChange,
	onCommit,
	onDiscard,
	onDraftChange,
	toolbar = true,
	labels: labelOverrides,
	emptyState,
	generateId = defaultGenerateId,
}) => {
	const labels = { ...defaultDashboardLabels, ...labelOverrides };
	const gridConfig = { ...DEFAULT_GRID, ...grid };
	const [catalogOpen, setCatalogOpen] = useState(false);
	const [configuringId, setConfiguringId] = useState<string | null>(null);

	const draft = useDashboardDraft({ widgets, mode, generateId, onDraftChange });
	const editing = mode === "edit";

	const layout = useMemo(
		() =>
			draft.items.map((it) => {
				const def = registry.get(it.type);
				return {
					i: it.id,
					x: it.layout.x,
					y: it.layout.y,
					w: it.layout.w,
					h: it.layout.h,
					minW: def?.minSize.w,
					minH: def?.minSize.h,
					maxW: def?.maxSize?.w,
					maxH: def?.maxSize?.h,
				};
			}),
		[draft.items, registry],
	);

	const configuring = configuringId
		? draft.items.find((w) => w.id === configuringId)
		: undefined;
	const configuringDef = configuring
		? registry.get(configuring.type)
		: undefined;

	const handleSave = () => {
		onCommit?.(draft.getDraft());
		onModeChange?.("view");
	};
	const handleDiscard = () => {
		onDiscard?.();
		onModeChange?.("view");
	};

	return (
		<Box>
			{toolbar && (
				<DashboardToolbar
					mode={mode}
					isDirty={draft.isDirty}
					labels={labels}
					onEdit={() => onModeChange?.("edit")}
					onAddWidget={() => setCatalogOpen(true)}
					onSave={handleSave}
					onDiscard={handleDiscard}
				/>
			)}

			{draft.items.length === 0 ? (
				(emptyState ?? (
					<EmptyState
						header={labels.emptyHeader}
						description={labels.emptyDescription}
					/>
				))
			) : (
				<Box css={GRID_CSS}>
					<ReactGridLayout
						className="layout"
						layout={layout}
						cols={gridConfig.cols}
						rowHeight={gridConfig.rowHeight}
						margin={gridConfig.margin}
						containerPadding={gridConfig.containerPadding}
						isDraggable={editing}
						isResizable={editing}
						draggableHandle=".rgl-drag-handle"
						draggableCancel=".rgl-no-drag"
						compactType="vertical"
						onLayoutChange={
							editing ? (l) => draft.updateLayouts(l) : undefined
						}
					>
						{draft.items.map((it) => (
							<div key={it.id}>
								<WidgetFrame
									definition={registry.get(it.type)}
									instance={it}
									mode={mode}
									labels={labels}
									onConfigure={setConfiguringId}
									onRemove={draft.removeWidget}
								/>
							</div>
						))}
					</ReactGridLayout>
				</Box>
			)}

			<WidgetCatalog
				open={catalogOpen}
				onClose={() => setCatalogOpen(false)}
				title={labels.catalogTitle}
				definitions={registry.getCatalog(
					grantedPermissions,
					availabilityContext,
				)}
				onSelect={draft.addWidget}
			/>

			{configuring && configuringDef && (
				<ConfigDrawer
					key={configuring.id}
					title={labels.configTitle}
					saveLabel={labels.save}
					def={configuringDef}
					instance={configuring}
					onClose={() => setConfiguringId(null)}
					onSave={(settings) => {
						draft.updateSettings(configuring.id, settings);
						setConfiguringId(null);
					}}
				/>
			)}
		</Box>
	);
};
Dashboard.displayName = "Dashboard";
```

- [ ] **Step 7: Run the test and typecheck**

Run: `npx vitest run src/components/dashboard/dashboard.test.tsx && npm run typecheck`
Expected: PASS (4 tests); typecheck clean. If `onLayoutChange`'s `l` parameter triggers a type error, type it as `import("react-grid-layout").Layout` — the array element is `{ i: string; x; y; w; h }`-compatible.

- [ ] **Step 8: Lint and commit**

```bash
npm run lint:write
git add package.json tsup.config.ts src/test/setup.ts src/components/dashboard/dashboard.tsx src/components/dashboard/dashboard.test.tsx
git commit -m "feat(dashboard): react-grid-layout engine with view/edit modes"
```

---

### Task 10: Public exports & packaging verification

**Files:**
- Create: `src/components/dashboard/index.ts`
- Modify: `src/components/index.ts:221-223` (add the Dashboard barrel after the existing Widget export)

**Interfaces:**
- Consumes: all public symbols from Tasks 1–9.
- Produces: `@knkcs/anker/components` re-exports the full dashboard surface.

- [ ] **Step 1: Create `src/components/dashboard/index.ts`**

```ts
export {
	Dashboard,
	type DashboardProps,
} from "./dashboard";
export {
	DashboardToolbar,
	type DashboardToolbarProps,
} from "./dashboard-toolbar";
export {
	type DashboardLabels,
	defaultDashboardLabels,
} from "./labels";
export {
	createWidgetRegistry,
	isWidgetAvailable,
	type WidgetRegistry,
} from "./registry";
export { resolveWidgetSettings } from "./resolve-settings";
export type {
	DashboardMode,
	GridConfig,
	WidgetConfigEditorProps,
	WidgetDefinition,
	WidgetInstance,
	WidgetLayout,
	WidgetRenderProps,
	WidgetSettingField,
	WidgetSize,
} from "./types";
export {
	type DashboardDraft,
	useDashboardDraft,
	type UseDashboardDraftArgs,
} from "./use-dashboard-draft";
export {
	WidgetCatalog,
	type WidgetCatalogProps,
} from "./widget-catalog";
export {
	WidgetConfigForm,
	type WidgetConfigFormProps,
} from "./widget-config-form";
export {
	WidgetFrame,
	type WidgetFrameProps,
} from "./widget-frame";
```

- [ ] **Step 2: Add the barrel to `src/components/index.ts`**

Append after the existing `// Widget` block (lines 221–223):

```ts
// Dashboard
export {
	createWidgetRegistry,
	Dashboard,
	DashboardToolbar,
	defaultDashboardLabels,
	isWidgetAvailable,
	resolveWidgetSettings,
	useDashboardDraft,
	WidgetCatalog,
	WidgetConfigForm,
	WidgetFrame,
} from "./dashboard";
export type {
	DashboardDraft,
	DashboardLabels,
	DashboardMode,
	DashboardProps,
	DashboardToolbarProps,
	GridConfig,
	UseDashboardDraftArgs,
	WidgetCatalogProps,
	WidgetConfigEditorProps,
	WidgetConfigFormProps,
	WidgetDefinition,
	WidgetFrameProps,
	WidgetInstance,
	WidgetLayout,
	WidgetRegistry,
	WidgetRenderProps,
	WidgetSettingField,
	WidgetSize,
} from "./dashboard";
```

- [ ] **Step 3: Build, typecheck, and verify exports**

Run: `npm run typecheck && npm run build && npm run verify-exports`
Expected: typecheck clean; tsup emits `dist/components/index.js` + `.d.ts`; `verify-exports` passes (the new symbols live under the already-declared `./components` subpath).

- [ ] **Step 4: Run the full test suite and lint**

Run: `npm run test && npm run lint`
Expected: all dashboard tests pass alongside the existing suite; lint (Biome + chakra-import check) clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/index.ts src/components/index.ts
git commit -m "feat(dashboard): export dashboard framework from @knkcs/anker/components"
```

---

### Task 11: Demo widgets, stories, docs & version bump

**Files:**
- Create: `src/components/dashboard/demo-widgets.tsx`
- Create: `src/components/dashboard/dashboard.stories.tsx`
- Modify: `CLAUDE.md` (Peer Dependencies list)
- Modify: `package.json` (`version` → `2.11.0`)

**Interfaces:**
- Consumes: public dashboard surface; `Text` from `../../primitives/typography`; icons from `lucide-react`.
- Produces: demo widgets + a `Components/Dashboard` Storybook page covering the seven §10 scenarios.

- [ ] **Step 1: Create `demo-widgets.tsx`**

```tsx
import { FileText, Hash, ShieldCheck } from "lucide-react";
import { Text } from "../../primitives/typography";
import { createWidgetRegistry } from "./registry";
import type { WidgetDefinition } from "./types";

export const statTileWidget: WidgetDefinition = {
	type: "demo-stat",
	name: "Stat tile",
	description: "A single labelled number",
	icon: <Hash size={18} />,
	category: "Metrics",
	minSize: { w: 2, h: 2 },
	defaultSize: { w: 3, h: 2 },
	maxSize: { w: 6, h: 4 },
	defaultSettings: { label: "Items", value: 42 },
	settingsSchema: [
		{ key: "label", label: "Label", type: "text", defaultValue: "Items" },
		{ key: "value", label: "Value", type: "number", defaultValue: 42 },
	],
	Component: ({ settings }) => (
		<>
			<Text fontSize="3xl" fontWeight="bold">
				{String(settings.value)}
			</Text>
			<Text fontSize="sm" color="muted">
				{String(settings.label)}
			</Text>
		</>
	),
};

export const notesWidget: WidgetDefinition = {
	type: "demo-notes",
	name: "Notes",
	description: "A free-text note",
	icon: <FileText size={18} />,
	category: "General",
	minSize: { w: 2, h: 2 },
	defaultSize: { w: 4, h: 3 },
	defaultSettings: { text: "Write something..." },
	settingsSchema: [
		{ key: "text", label: "Text", type: "text", defaultValue: "Write something..." },
	],
	Component: ({ settings }) => <Text fontSize="sm">{String(settings.text)}</Text>,
};

export const adminWidget: WidgetDefinition = {
	type: "demo-admin",
	name: "Admin panel",
	description: "Visible only with the 'admin' permission",
	icon: <ShieldCheck size={18} />,
	category: "Admin",
	minSize: { w: 2, h: 2 },
	defaultSize: { w: 3, h: 2 },
	requiredPermissions: ["admin"],
	Component: () => <Text fontSize="sm">Admin only</Text>,
};

export const demoRegistry = createWidgetRegistry([
	statTileWidget,
	notesWidget,
	adminWidget,
]);
```

- [ ] **Step 2: Create `dashboard.stories.tsx`**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dashboard } from "./dashboard";
import { demoRegistry, statTileWidget } from "./demo-widgets";
import type { DashboardMode, WidgetInstance } from "./types";
import { WidgetCatalog } from "./widget-catalog";
import { WidgetConfigForm } from "./widget-config-form";

const seed: WidgetInstance[] = [
	{ id: "a", type: "demo-stat", settings: { label: "Users", value: 128 }, layout: { x: 0, y: 0, w: 3, h: 2 } },
	{ id: "b", type: "demo-notes", settings: { text: "Welcome to the dashboard." }, layout: { x: 3, y: 0, w: 4, h: 3 } },
];

const meta = {
	title: "Components/Dashboard",
	component: Dashboard,
} satisfies Meta<typeof Dashboard>;
export default meta;
type Story = StoryObj<typeof meta>;

function Harness({
	initial,
	initialMode = "view",
	permissions,
}: {
	initial: WidgetInstance[];
	initialMode?: DashboardMode;
	permissions?: string[];
}) {
	const [widgets, setWidgets] = useState(initial);
	const [mode, setMode] = useState<DashboardMode>(initialMode);
	return (
		<Dashboard
			registry={demoRegistry}
			widgets={widgets}
			mode={mode}
			grantedPermissions={permissions}
			onModeChange={setMode}
			onCommit={setWidgets}
		/>
	);
}

export const Default: Story = { render: () => <Harness initial={seed} /> };
export const EditMode: Story = {
	render: () => <Harness initial={seed} initialMode="edit" />,
};
export const Empty: Story = { render: () => <Harness initial={[]} /> };
export const UnknownWidget: Story = {
	render: () => (
		<Harness
			initial={[
				{ id: "x", type: "ghost", settings: {}, layout: { x: 0, y: 0, w: 3, h: 2 } },
			]}
			initialMode="edit"
		/>
	),
};
export const WithAdminPermission: Story = {
	render: () => <Harness initial={seed} initialMode="edit" permissions={["admin"]} />,
};

export const Catalog: StoryObj<typeof WidgetCatalog> = {
	render: () => {
		const [open, setOpen] = useState(true);
		return (
			<WidgetCatalog
				open={open}
				onClose={() => setOpen(false)}
				definitions={demoRegistry.getCatalog()}
				onSelect={() => {}}
			/>
		);
	},
};

export const ConfigForm: StoryObj<typeof WidgetConfigForm> = {
	render: () => {
		const [settings, setSettings] = useState<Record<string, unknown>>({
			label: "Items",
			value: 42,
		});
		return (
			<WidgetConfigForm
				schema={statTileWidget.settingsSchema ?? []}
				settings={settings}
				onChange={setSettings}
			/>
		);
	},
};
```

- [ ] **Step 3: Update `CLAUDE.md` Peer Dependencies**

In the `## Peer Dependencies` list, add a line:

```markdown
- react-grid-layout ^2.2.3 (optional — required only for the Dashboard component)
```

- [ ] **Step 4: Bump the package version**

In `package.json`, change `"version": "2.10.1"` to `"version": "2.11.0"` (additive minor — new Dashboard surface, no breaking changes).

- [ ] **Step 5: Verify Storybook builds and the suite is green**

Run: `npm run build:storybook && npm run test && npm run lint && npm run typecheck`
Expected: Storybook builds without errors (the `Components/Dashboard` stories compile); tests, lint, and typecheck all clean.

- [ ] **Step 6: Commit**

```bash
npm run lint:write
git add src/components/dashboard/demo-widgets.tsx src/components/dashboard/dashboard.stories.tsx CLAUDE.md package.json
git commit -m "feat(dashboard): demo widgets, storybook coverage, docs; release 2.11.0"
```

---

### Task 12: Documentation (usage guide for services + AI-session rules)

Added after the original plan: comprehensive docs so other services and AI
sessions know how to use the framework. Three audiences: service developers
(Storybook MDX, published to GitHub Pages), AI sessions in consuming services
(`CLAUDE-ANKER.md`, `@`-imported into their CLAUDE.md), and AI sessions inside
anker (`CLAUDE.md` Patterns note).

**Files:**
- Create: `src/components/dashboard/dashboard.mdx`
- Modify: `CLAUDE-ANKER.md` (append a `## Dashboard & Widgets` section at the end)
- Modify: `CLAUDE.md` (append a `### Dashboard & Widget Framework` subsection at the end of the `## Patterns` section)

**Interfaces:** Consumes the public dashboard surface + the `dashboard.stories`
from Task 11. Produces documentation only — no code.

- [ ] **Step 1: Create `src/components/dashboard/dashboard.mdx`** (verbatim)

````mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./dashboard.stories";

<Meta of={Stories} />

# Dashboard & Widgets

A framework for building configurable, drag-and-resize widget dashboards. anker
owns the grid engine, the edit experience, and the chrome; **your service owns
the widgets, their data, and persistence.**

<Canvas of={Stories.Default} />

## Architecture at a glance

- **You define widgets** as `WidgetDefinition` objects — each declares its
  identity, sizing, settings schema, availability, and a `Component` that
  renders its body and fetches its own data.
- **You build a registry** with `createWidgetRegistry(defs)`.
- **You render `<Dashboard>`** with the saved `widgets` array (the persisted
  truth) and the current `mode`. anker handles drag, resize, add, remove,
  configure, and the draft / discard / dirty edit session internally.
- **You persist** the `WidgetInstance[]` that `onCommit` hands back.

anker never fetches data, never talks to your backend, and never imports
service code.

## 1. Define a widget

The `Component` receives resolved `settings`, the instance `id`, and the
current `mode`, and renders the widget body. The frame (card, title, icon, edit
controls) is supplied by anker.

```tsx
import type { WidgetDefinition } from "@knkcs/anker/components";
import { ListChecks } from "lucide-react";

interface MyTasksSettings { limit: number }

export const myTasksWidget: WidgetDefinition<MyTasksSettings> = {
  type: "my-tasks",                 // stable id, persisted in instances
  name: "My tasks",                 // already-translated string (no i18n keys)
  description: "Tasks assigned to you",
  icon: <ListChecks size={18} />,   // any lucide node
  category: "Work",                 // free-form grouping for the catalog
  minSize: { w: 3, h: 2 },          // grid units
  defaultSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 6 },
  defaultSettings: { limit: 5 },
  settingsSchema: [
    { key: "limit", label: "Max tasks", type: "number", defaultValue: 5 },
  ],
  requiredPermissions: ["task.read"], // opaque tokens; see Availability
  Component: ({ settings }) => <MyTasksList limit={settings.limit} />, // fetches its own data
};
```

The widget `Component` is plain React — fetch data with your own hooks
(react-query, etc.) inside it. anker passes `settings` as the resolved merge of
`defaultSettings` and the instance's saved settings.

## 2. Build a registry

```tsx
import { createWidgetRegistry } from "@knkcs/anker/components";

const registry = createWidgetRegistry([myTasksWidget, calendarWidget, statTileWidget]);
```

`createWidgetRegistry` is a factory (not a global singleton) — create one per
dashboard and memoize it (`useMemo`) so it's stable across renders. It exposes
`get(type)`, `getAll()`, and `getCatalog(grantedPermissions?, ctx?)`.

## 3. Render the Dashboard (controlled)

`<Dashboard>` is **controlled**: your app owns the saved `widgets` array and the
`mode`. anker owns the ephemeral edit session.

```tsx
import {
  Dashboard,
  createWidgetRegistry,
  type WidgetInstance,
  type DashboardMode,
} from "@knkcs/anker/components";

function MyDashboard() {
  const registry = useMemo(() => createWidgetRegistry(defs), []);
  const [widgets, setWidgets] = useState<WidgetInstance[]>(loadedFromBackend);
  const [mode, setMode] = useState<DashboardMode>("view");

  return (
    <Dashboard
      registry={registry}
      widgets={widgets}
      mode={mode}
      grantedPermissions={user.permissions}
      onModeChange={setMode}
      onCommit={(next) => { setWidgets(next); saveToBackend(next); }}
    />
  );
}
```

That's the whole integration: **load → pass `widgets` → handle `onCommit` →
toggle `mode`.** In edit mode, anker tracks a draft as the user drags, resizes,
adds, removes, and configures widgets. **Save** calls `onCommit(draft)` and
returns to view; **Discard** reverts. Observe in-flight changes with
`onDraftChange` if you need an "unsaved changes" indicator or autosave.

<Canvas of={Stories.EditMode} />

## 4. Persist instances

`onCommit` hands you a `WidgetInstance[]` — the serializable shape you store and
reload:

```ts
interface WidgetInstance {
  id: string;                          // unique per placed widget
  type: string;                        // references WidgetDefinition.type
  settings: Record<string, unknown>;   // instance overrides of defaultSettings
  layout: { x: number; y: number; w: number; h: number }; // grid units
}
```

Store this array however you like (per-user, per-role). To restore, pass it back
as `widgets`. An unknown `type` (a widget your build no longer ships) renders a
removable "Unknown widget" placeholder rather than crashing, and round-trips
safely on save.

## 5. Availability (permissions / feature flags)

A widget is offered in the catalog only when available to the current user:

- `requiredPermissions?: string[]` — opaque tokens. The widget shows only if
  every token is in the `grantedPermissions` you pass to `<Dashboard>`. anker
  assigns these strings no meaning — map them to your role/permission model.
- `isAvailable?: (ctx) => boolean` — an escape hatch for arbitrary logic
  (feature flags, license tiers). Receives the `availabilityContext` you pass to
  `<Dashboard>`. Returning `false` hides the widget.

<Canvas of={Stories.WithAdminPermission} />

## 6. Settings & the config form

Declare a `settingsSchema` (`text | number | boolean | select`) and anker
renders a schema-driven config form when the user clicks the gear in edit mode:

<Canvas of={Stories.ConfigForm} />

For settings the generic form can't express, supply a custom
`ConfigEditor: React.FC<WidgetConfigEditorProps>` on the definition — anker
renders it instead.

## 7. The catalog

In edit mode, "Add widget" opens a catalog grouped by `category`, filtered by
availability:

<Canvas of={Stories.Catalog} />

## Customization

- **Strings** — every user-facing label is overridable via the `labels` prop (a
  partial `DashboardLabels`); English defaults otherwise.
- **Grid** — tune `grid={{ cols, rowHeight, margin, containerPadding }}`
  (defaults: 12 cols, 90px rows, 16px margin).
- **Empty state** — pass `emptyState` to override the default.
- **Toolbar** — `toolbar={false}` removes the built-in Edit / Add / Save /
  Discard bar if you drive `mode` yourself.

## Peer dependency

The grid requires **`react-grid-layout`** as an **optional peer dependency**.
Install it in services that render a `<Dashboard>`:

```bash
npm install react-grid-layout@^2.2.3
```

Services that don't render a dashboard don't need it. anker ships the grid
styles itself (via its Chakra layer) — you do **not** import any
`react-grid-layout` CSS. (Internally anker imports the stable flat-props API
from the `react-grid-layout/legacy` subpath; that's an implementation detail —
you only install the package.)

## Accessibility

- All edit controls (drag handle, configure, remove, add) carry configurable
  `aria-label`s (English defaults) and meet the 44×44px touch-target minimum.
- The catalog and config editor are focus-trapping drawers.
- Keyboard drag-and-drop reordering is not yet supported (the grid is
  pointer-first) — a planned enhancement.
- The resize cursor uses `se-resize` (a physical direction); in RTL the handle
  still works but the cursor hint isn't mirrored (CSS has no logical cursor).

## Guidelines

- **Do** keep widgets self-contained: each fetches its own data and reads only
  its `settings`.
- **Do** memoize the registry and the `widgets` / derived arrays.
- **Don't** mutate the `widgets` array you pass in — treat it as immutable;
  apply `onCommit`'s result.
- **Don't** put i18n keys in a widget's `name` / `description` — pass
  already-translated strings.

## Props

<ArgTypes of={Stories} />
````

- [ ] **Step 2: Append to `CLAUDE-ANKER.md`** (a new `## Dashboard & Widgets` section at the end of the file, verbatim)

````markdown
## Dashboard & Widgets

Build configurable widget dashboards with the `Dashboard` framework from
`@knkcs/anker/components`. anker owns the grid, edit UX, and chrome; your
service owns the widgets, their data, and persistence.

**The contract.** A widget is a `WidgetDefinition` (`type`, `name`, `icon?`,
`category?`, `minSize` / `defaultSize` / `maxSize?` in grid units,
`defaultSettings?`, `settingsSchema?`, `requiredPermissions?`, `isAvailable?`,
`Component`, `ConfigEditor?`). Build a registry with
`createWidgetRegistry(defs)`. Render
`<Dashboard registry widgets mode onModeChange onCommit grantedPermissions />`.

**Controlled model.** Your app owns the saved `widgets: WidgetInstance[]` and
`mode`; anker owns the edit-session draft. Integration is: load → pass
`widgets` → persist on `onCommit` → toggle `mode`. Save calls `onCommit(draft)`;
Discard reverts.

### Do
- **Let each widget fetch its own data** inside its `Component`. Why: anker is
  domain-free and never fetches — centralizing data would couple the library to
  your backend.
- **Memoize the registry and `widgets`.** Why: a new registry/array reference
  each render churns the grid.
- **Pass already-translated strings** for `name` / `description` / `labels`.
  Why: anker uses props, not i18n keys.
- **Map your permission model to `requiredPermissions`** (opaque string tokens)
  and pass `grantedPermissions`; use `isAvailable(ctx)` for feature
  flags / license tiers.
- **Persist the `WidgetInstance[]` from `onCommit`** and pass it back as
  `widgets` to restore.

### Don't
- **Don't mutate the `widgets` array** you pass in — treat it as immutable and
  apply `onCommit`'s result. Why: it's the controlled source of truth.
- **Don't import any `react-grid-layout` CSS** — anker ships the grid styles.
  Just `npm i react-grid-layout@^2.2.3` (optional peer dep, only for services
  that render a `<Dashboard>`).
- **Don't rebuild draft / discard / dirty logic** — anker owns the edit
  session; read `onDraftChange` if you need an unsaved-changes indicator.
````

- [ ] **Step 3: Append to `CLAUDE.md`** — add this subsection at the END of the `## Patterns` section (immediately before the next top-level `##` heading after Patterns), verbatim:

````markdown
### Dashboard & Widget Framework

`src/components/dashboard/` provides a domain-free dashboard framework (exported
from `@knkcs/anker/components`): the widget contract (`WidgetDefinition`,
`WidgetInstance`, `WidgetRenderProps`, …), `createWidgetRegistry`, and
`<Dashboard>` — a `react-grid-layout` engine with view/edit modes, a catalog, a
schema-driven config form, and a toolbar.

- **Controlled model**: consumers own the saved `widgets` + `mode`; the
  `useDashboardDraft` hook owns the ephemeral edit-session draft
  (add/remove/resize/discard/dirty). `<Dashboard>` emits `onCommit(draft)` on
  Save and reverts on Discard.
- **Domain-free**: widgets self-fetch data; strings are props
  (`DashboardLabels`); permissions are opaque `requiredPermissions` string
  tokens + an optional `isAvailable(ctx)` predicate.
- **react-grid-layout** is an optional peer dependency (`^2.2.3`). anker imports
  its flat-props API from the `react-grid-layout/legacy` subpath (2.x relocated
  it there) and injects the grid CSS via a Chakra `css` object — no stylesheet
  import. Both `react-grid-layout` and `react-grid-layout/legacy` are in tsup
  `external`.
- Full usage guide: the `Components/Dashboard` Storybook docs
  (`src/components/dashboard/dashboard.mdx`).
````

- [ ] **Step 4: Verify the Storybook build picks up the MDX and lint is clean**

Run: `npm run build:storybook && npm run lint`
Expected: Storybook build succeeds (the `dashboard.mdx` compiles and attaches to
the `Components/Dashboard` page); lint clean (no regressions).

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/dashboard.mdx CLAUDE-ANKER.md CLAUDE.md
git commit -m "docs(dashboard): MDX usage guide + CLAUDE-ANKER + CLAUDE.md framework notes"
```

---

## Self-Review

**1. Spec coverage** (against `2026-06-27-dashboard-widgets-design.md`):

| Spec section | Task(s) |
|---|---|
| §3 contract types | Task 1 |
| §4 registry (factory, availability predicate) | Task 2 |
| §5 `<Dashboard>` props + flow (controlled widgets/mode, draft, onCommit/onDraftChange) | Tasks 4, 9 |
| §6 chrome: frame / catalog / config form / toolbar | Tasks 5, 6, 7, 8 |
| §6.1 module layout | Tasks 1–11 (matches exactly) |
| §7 errors: unknown type, missing settings, empty, rgl CSS via Chakra layer | Tasks 3 (merge), 7 (unknown), 9 (`GRID_CSS`, EmptyState) |
| §8 accessibility (aria-labels w/ English defaults, touch targets via IconButton) | Tasks 1 (labels), 7, 8 |
| §9 optional peer dep + injected CSS | Task 9 |
| §10 testing + 7 stories + 2 demo widgets | Tasks 1–9 (tests), 11 (stories/demos; adminWidget = 3rd demo for permission story) |
| §11 Core migration | Out of scope (design validated against Core's contract in §3 — no task) |
| §13 acceptance criteria 1–8 | Criterion 1 → Task 10; 2 → Task 9; 3 → Tasks 2/9; 4 → Tasks 3/7/9; 5 → Task 9; 6 → Task 11; 7 → contract in Task 1 (paper-validated, no code); 8 → every task's lint/typecheck/displayName |

No gaps. (Acceptance criterion 7 — "contract expresses Core's widgets" — is a paper check performed during review, not a code task; `WidgetDefinition` in Task 1 carries every field Core's `WidgetConfig`/`Widget` use except the domain `Permission` enum, which maps to `requiredPermissions: string[]`.)

**2. Placeholder scan:** No `TBD`/`TODO`/"handle edge cases"/"similar to Task N". Every code step shows full code; every test step shows full assertions.

**3. Type consistency:** `WidgetInstance`, `WidgetDefinition`, `DashboardMode`, `GridConfig`, `WidgetRegistry`, `DashboardDraft`, `DashboardLabels`, `defaultDashboardLabels`, `resolveWidgetSettings`, `useDashboardDraft`, `WidgetFrameProps`, `WidgetCatalogProps`, `WidgetConfigFormProps`, `DashboardToolbarProps`, `DashboardProps` are used with identical signatures across producing/consuming tasks. `updateLayouts` takes `Array<{ i; x; y; w; h }>` in both the hook (Task 4) and the rgl `onLayoutChange` wiring (Task 9). `getCatalog(grantedPermissions?, ctx?)` is consistent in Tasks 2 and 9. The barrel in Task 10 re-exports exactly the symbols the earlier tasks produced.
