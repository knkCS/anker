# SubNavLayout + NavList Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `<SubNavLayout>` template (issue #124) plus extract the icon-row-with-active-pill pattern out of `<Sidebar>` into a shared `<NavList>` primitive that both consume — in a single PR.

**Architecture:** New `<NavList>` primitive owns the visual contract (group label, icon row, count, inset-shadow active state, trailing pill, collapsed tooltips). It reads its collapsed mode from a `NavListModeContext` provider. Two consumers publish that context: existing `<Sidebar>` (refactored to delegate to `NavList`) and the new `<SubNavLayout>` template (provides 2-column grid, divider, floating toggle, `localStorage` persistence). No outer chrome changes — composes alongside `<AppShell>`, `<DetailPageTemplate>`, and `<ContextRail>`.

**Tech Stack:** React 18, Chakra UI v3, TypeScript strict, Vitest + @testing-library/react, Storybook 8, Biome. Spec: `docs/superpowers/specs/2026-05-18-subnav-layout-design.md`.

---

## File Plan

### New files
- `src/components/nav-list/nav-list-context.tsx` — `NavListModeContext`, `NavListModeProvider`, `useNavListMode()` hook
- `src/components/nav-list/nav-list.tsx` — `<NavList>` + `.Group` + `.Item`
- `src/components/nav-list/index.ts` — re-exports
- `src/components/nav-list/nav-list.test.tsx`
- `src/components/nav-list/nav-list.stories.tsx`
- `src/templates/subnav-layout.tsx` — `<SubNavLayout>` + `.Nav` + `.Detail` + `.Toolbar`
- `src/templates/subnav-layout.test.tsx`
- `src/templates/subnav-layout.stories.tsx`

### Modified files
- `src/components/sidebar/sidebar.tsx` — `Sidebar.Section` / `Sidebar.Item` become thin wrappers; Sidebar root publishes `NavListModeProvider`
- `src/components/index.ts` — export `NavList`
- `src/templates/index.ts` — export `SubNavLayout`
- `docs/page-patterns.md` — new § 8 + one-line in § 3
- `CLAUDE.md` — bump template/component counts; scaffolding entry
- `CLAUDE-ANKER.md` — one-line rule

---

## Pre-flight

- [ ] **Step 0.1: Confirm clean working tree**

Run: `git status`
Expected: `working tree clean` on main (or whichever branch this PR is being built on).

- [ ] **Step 0.2: Create feature branch**

Run: `git checkout -b feat/subnav-layout`
Expected: switched to a new branch.

- [ ] **Step 0.3: Install + verify baseline**

Run: `npm install && npm run lint && npm run typecheck && npm test -- --run`
Expected: all green. If anything fails on a clean tree, stop and report — do not start the plan on top of a broken baseline.

---

## Task 1: NavListModeContext

Establishes the collapsed-mode contract that `<NavList>` reads and consumers publish. Tiny file, no UI.

**Files:**
- Create: `src/components/nav-list/nav-list-context.tsx`

- [ ] **Step 1.1: Create the context file**

```tsx
// src/components/nav-list/nav-list-context.tsx
import { createContext, useContext } from "react";

export interface NavListMode {
	/** When true, NavList items render icon-only with tooltips. */
	collapsed: boolean;
}

const NavListModeContext = createContext<NavListMode | null>(null);

export const NavListModeProvider = NavListModeContext.Provider;

/**
 * Read the collapsed mode published by the nearest parent
 * (Sidebar, SubNavLayout, etc.). Returns `{ collapsed: false }`
 * when no provider is present — NavList is usable standalone.
 */
export function useNavListMode(): NavListMode {
	return useContext(NavListModeContext) ?? { collapsed: false };
}
```

- [ ] **Step 1.2: Commit**

```bash
git add src/components/nav-list/nav-list-context.tsx
git commit -m "feat(nav-list): add NavListModeContext"
```

---

## Task 2: NavList — failing test for default render

Lock in the public API and the basic structure before any styling code.

**Files:**
- Create: `src/components/nav-list/nav-list.test.tsx`

- [ ] **Step 2.1: Write the failing test file**

```tsx
// src/components/nav-list/nav-list.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavList } from "./nav-list";
import { NavListModeProvider } from "./nav-list-context";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("NavList", () => {
	it("renders as a <nav> with aria-label", () => {
		renderWithChakra(
			<NavList aria-label="Catalogs">
				<NavList.Group label="Page">
					<NavList.Item>Page geometries</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		const nav = screen.getByRole("navigation", { name: "Catalogs" });
		expect(nav).toBeInTheDocument();
	});

	it("renders group label and item text when expanded", () => {
		renderWithChakra(
			<NavList aria-label="Catalogs">
				<NavList.Group label="Typography">
					<NavList.Item>Fonts</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(screen.getByText("Typography")).toBeInTheDocument();
		expect(screen.getByText("Fonts")).toBeInTheDocument();
	});
});
```

- [ ] **Step 2.2: Run test — verify it fails**

Run: `npm test -- --run src/components/nav-list/nav-list.test.tsx`
Expected: FAIL — `Cannot find module './nav-list'` (or similar import error).

---

## Task 3: NavList.tsx — minimal implementation

Make Task 2's tests pass. Keep behavior minimal — styling lands in later tasks.

**Files:**
- Create: `src/components/nav-list/nav-list.tsx`
- Create: `src/components/nav-list/index.ts`

- [ ] **Step 3.1: Write nav-list.tsx**

```tsx
// src/components/nav-list/nav-list.tsx
import type { ReactNode } from "react";
import React from "react";
import { Box, Flex } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { Tooltip } from "../../primitives/tooltip";
import { useNavListMode } from "./nav-list-context";

export interface NavListProps {
	"aria-label"?: string;
	children: ReactNode;
}

const NavListRoot = ({ children, ...rest }: NavListProps) => (
	<Box as="nav" aria-label={rest["aria-label"]}>
		{children}
	</Box>
);
NavListRoot.displayName = "NavList";

export interface NavListGroupProps {
	label?: string;
	children: ReactNode;
}

const NavListGroup = ({ label, children }: NavListGroupProps) => {
	const { collapsed } = useNavListMode();
	return (
		<Box mb="2" px="2">
			{label && !collapsed && (
				<Text
					fontSize="2xs"
					fontWeight="semibold"
					letterSpacing="wider"
					textTransform="uppercase"
					color="subtle"
					px="2"
					pt="2"
					pb="1"
				>
					{label}
				</Text>
			)}
			<Flex direction="column" gap="0.5">
				{children}
			</Flex>
		</Box>
	);
};
NavListGroup.displayName = "NavList.Group";

export interface NavListItemProps {
	icon?: ReactNode;
	count?: number | string;
	active?: boolean;
	asChild?: boolean;
	/** Override tooltip text when the parent is collapsed. */
	label?: string;
	children: ReactNode;
}

const NavListItem = ({
	icon,
	count,
	active,
	asChild,
	label,
	children,
}: NavListItemProps) => {
	const { collapsed } = useNavListMode();

	const itemStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		justifyContent: collapsed ? "center" : "flex-start",
		gap: "var(--chakra-spacing-2)",
		paddingInline: "var(--chakra-spacing-3)",
		paddingBlock: "var(--chakra-spacing-2)",
		borderRadius: "var(--chakra-radii-sm)",
		fontSize: "var(--chakra-font-sizes-sm)",
		fontWeight: active
			? "var(--chakra-font-weights-medium)"
			: "var(--chakra-font-weights-normal)",
		color: active
			? "var(--chakra-colors-primary-700)"
			: "var(--chakra-colors-default)",
		background: active ? "var(--chakra-colors-bg-surface)" : "transparent",
		boxShadow: active
			? "inset 0 0 0 1px var(--chakra-colors-border), 0 1px 2px rgba(0,0,0,0.04)"
			: undefined,
		position: "relative",
		textDecoration: "none",
		cursor: "pointer",
	};

	const iconEl = icon ? (
		<Box display="inline-flex" alignItems="center" flexShrink={0}>
			{icon}
		</Box>
	) : null;

	const countEl =
		count !== undefined && !collapsed ? (
			<Text
				as="span"
				fontSize="xs"
				color={active ? "primary.700" : "subtle"}
				flexShrink={0}
				marginInlineStart="auto"
				style={{ fontVariantNumeric: "tabular-nums" }}
			>
				{count}
			</Text>
		) : null;

	// The active pill is a flex child. When there's no count it gets
	// margin-inline-start: auto (push to end); when there IS a count the
	// count owns the auto-margin and the pill sits after it with a small gap.
	const pillEl =
		active && !collapsed ? (
			<span
				aria-hidden="true"
				style={{
					width: 3,
					height: 14,
					background: "var(--chakra-colors-primary-700)",
					borderRadius: 999,
					flexShrink: 0,
					marginInlineStart:
						count !== undefined ? "var(--chakra-spacing-2)" : "auto",
				}}
			/>
		) : null;

	const tooltipLabel = label || (typeof children === "string" ? children : "");

	const wrapTooltip = (node: React.ReactElement) =>
		collapsed && tooltipLabel ? (
			<Tooltip content={tooltipLabel} positioning={{ placement: "right" }}>
				{node}
			</Tooltip>
		) : (
			node
		);

	if (asChild) {
		const child = React.Children.only(children) as React.ReactElement<
			React.HTMLAttributes<HTMLElement> & {
				children?: ReactNode;
			}
		>;
		const cloned = React.cloneElement(
			child,
			{
				"data-active": active ? "true" : "false",
				"aria-current": active ? "page" : undefined,
				style: {
					...itemStyle,
					...(child.props.style as React.CSSProperties | undefined),
				},
			},
			iconEl,
			collapsed ? null : child.props.children,
			countEl,
			pillEl,
		);
		return wrapTooltip(cloned);
	}

	return wrapTooltip(
		<Box
			data-testid="nav-list-item"
			data-active={active ? "true" : "false"}
			aria-current={active ? "page" : undefined}
			style={itemStyle}
		>
			{iconEl}
			{!collapsed && children}
			{countEl}
			{pillEl}
		</Box>,
	);
};
NavListItem.displayName = "NavList.Item";

export const NavList = Object.assign(NavListRoot, {
	Group: NavListGroup,
	Item: NavListItem,
});
```

- [ ] **Step 3.2: Write the index re-export**

```ts
// src/components/nav-list/index.ts
export { NavList } from "./nav-list";
export type {
	NavListProps,
	NavListGroupProps,
	NavListItemProps,
} from "./nav-list";
export {
	NavListModeProvider,
	useNavListMode,
	type NavListMode,
} from "./nav-list-context";
```

- [ ] **Step 3.3: Run Task 2's tests — verify they now pass**

Run: `npm test -- --run src/components/nav-list/nav-list.test.tsx`
Expected: 2 tests PASS.

- [ ] **Step 3.4: Commit**

```bash
git add src/components/nav-list/
git commit -m "feat(nav-list): add NavList primitive with Group and Item"
```

---

## Task 4: NavList — active state visual contract test

Lock down the inset-shadow / primary-color / pill rendering so the Sidebar refactor can't drift.

**Files:**
- Modify: `src/components/nav-list/nav-list.test.tsx` (add to existing `describe`)

- [ ] **Step 4.1: Append active-state tests**

Add the following inside the existing `describe("NavList", () => {` block, before its closing `})`:

```tsx
	it("active item carries inset box-shadow border and primary color", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item active>Glue patterns</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		const row = screen.getByTestId("nav-list-item");
		expect(row).toHaveAttribute("data-active", "true");
		expect(row).toHaveAttribute("aria-current", "page");
		const style = row.getAttribute("style") || "";
		expect(style).toContain("box-shadow: inset 0 0 0 1px");
		expect(style).toContain("color: var(--chakra-colors-primary-700)");
	});

	it("active item renders the trailing pill as a flex child", () => {
		const { container } = renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item active>Glue patterns</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		// Pill is the aria-hidden <span> sibling at the end of the row.
		const pill = container.querySelector('span[aria-hidden="true"]');
		expect(pill).not.toBeNull();
		expect(pill).toHaveStyle({ width: "3px", height: "14px" });
	});

	it("non-active item renders no pill", () => {
		const { container } = renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item>Fonts</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
	});

	it("renders count when provided", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item count={10}>Glue patterns</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(screen.getByText("10")).toBeInTheDocument();
	});
```

- [ ] **Step 4.2: Run the tests — verify they pass**

Run: `npm test -- --run src/components/nav-list/nav-list.test.tsx`
Expected: 6 tests PASS (2 prior + 4 new).

- [ ] **Step 4.3: Commit**

```bash
git add src/components/nav-list/nav-list.test.tsx
git commit -m "test(nav-list): pin active-state, pill, and count rendering"
```

---

## Task 5: NavList — collapsed-mode test

**Files:**
- Modify: `src/components/nav-list/nav-list.test.tsx`

- [ ] **Step 5.1: Append collapsed-mode tests**

Add inside the same `describe`:

```tsx
	it("hides group label, item text, count, and pill when collapsed", () => {
		renderWithChakra(
			<NavListModeProvider value={{ collapsed: true }}>
				<NavList aria-label="x">
					<NavList.Group label="Typography">
						<NavList.Item count={10} active>
							Glue patterns
						</NavList.Item>
					</NavList.Group>
				</NavList>
			</NavListModeProvider>,
		);
		expect(screen.queryByText("Typography")).not.toBeInTheDocument();
		expect(screen.queryByText("Glue patterns")).not.toBeInTheDocument();
		expect(screen.queryByText("10")).not.toBeInTheDocument();
	});

	it("supports asChild router pattern", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item active asChild>
						<a href="/glue" data-testid="link">
							Glue patterns
						</a>
					</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		const link = screen.getByTestId("link");
		expect(link.tagName).toBe("A");
		expect(link).toHaveAttribute("data-active", "true");
		expect(link).toHaveAttribute("aria-current", "page");
	});
```

- [ ] **Step 5.2: Run tests — verify they pass**

Run: `npm test -- --run src/components/nav-list/nav-list.test.tsx`
Expected: 8 tests PASS.

- [ ] **Step 5.3: Commit**

```bash
git add src/components/nav-list/nav-list.test.tsx
git commit -m "test(nav-list): cover collapsed mode and asChild composition"
```

---

## Task 6: NavList stories

**Files:**
- Create: `src/components/nav-list/nav-list.stories.tsx`

- [ ] **Step 6.1: Write the stories file**

```tsx
// src/components/nav-list/nav-list.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import {
	AlignVerticalJustifyCenter,
	FileText,
	Newspaper,
	Palette,
	Type,
} from "lucide-react";
import { Box } from "../../primitives/layout";
import { NavList } from "./nav-list";
import { NavListModeProvider } from "./nav-list-context";

const meta = {
	title: "Components/NavList",
	component: NavList,
	parameters: { layout: "padded" },
} satisfies Meta<typeof NavList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Box w="240px">
			<NavList aria-label="Catalogs">
				<NavList.Group label="Page">
					<NavList.Item icon={<FileText size={14} />} count={1}>
						Page geometries
					</NavList.Item>
					<NavList.Item icon={<Newspaper size={14} />} count={5}>
						Master pages
					</NavList.Item>
				</NavList.Group>
				<NavList.Group label="Typography">
					<NavList.Item icon={<Type size={14} />} count={2}>
						Fonts
					</NavList.Item>
					<NavList.Item
						icon={<AlignVerticalJustifyCenter size={14} />}
						count={10}
						active
					>
						Glue patterns
					</NavList.Item>
				</NavList.Group>
				<NavList.Group label="Visual">
					<NavList.Item icon={<Palette size={14} />} count={5}>
						Colors
					</NavList.Item>
				</NavList.Group>
			</NavList>
		</Box>
	),
};

export const WithoutGroupLabels: Story = {
	render: () => (
		<Box w="240px">
			<NavList aria-label="Flat list">
				<NavList.Group>
					<NavList.Item icon={<FileText size={14} />}>One</NavList.Item>
					<NavList.Item icon={<Newspaper size={14} />} active>
						Two
					</NavList.Item>
					<NavList.Item icon={<Type size={14} />}>Three</NavList.Item>
				</NavList.Group>
			</NavList>
		</Box>
	),
};

export const Collapsed: Story = {
	render: () => (
		<Box w="56px">
			<NavListModeProvider value={{ collapsed: true }}>
				<NavList aria-label="Catalogs">
					<NavList.Group label="Page">
						<NavList.Item icon={<FileText size={14} />}>
							Page geometries
						</NavList.Item>
						<NavList.Item icon={<Newspaper size={14} />}>
							Master pages
						</NavList.Item>
					</NavList.Group>
					<NavList.Group label="Typography">
						<NavList.Item
							icon={<AlignVerticalJustifyCenter size={14} />}
							active
						>
							Glue patterns
						</NavList.Item>
					</NavList.Group>
				</NavList>
			</NavListModeProvider>
		</Box>
	),
};

export const AsChildLink: Story = {
	render: () => (
		<Box w="240px">
			<NavList aria-label="Routes">
				<NavList.Group label="Routes">
					<NavList.Item icon={<FileText size={14} />} active asChild>
						<a href="#a">Active route</a>
					</NavList.Item>
					<NavList.Item icon={<Newspaper size={14} />} asChild>
						<a href="#b">Other route</a>
					</NavList.Item>
				</NavList.Group>
			</NavList>
		</Box>
	),
};
```

- [ ] **Step 6.2: Verify Storybook builds**

Run: `npm run dev` then open `http://localhost:6006/?path=/story/components-navlist--default` in a browser. Confirm all four stories render and "Glue patterns" shows the active state with pill.
After visual verification stop the dev server (Ctrl-C).

- [ ] **Step 6.3: Commit**

```bash
git add src/components/nav-list/nav-list.stories.tsx
git commit -m "docs(nav-list): add storybook stories"
```

---

## Task 7: Export NavList from components barrel

**Files:**
- Modify: `src/components/index.ts`

- [ ] **Step 7.1: Inspect the existing barrel**

Run: `cat src/components/index.ts`
Locate the exports in alphabetical order (or in the project's established order).

- [ ] **Step 7.2: Add the export**

Insert in alphabetical position (after `menu` / before `pagination`, or matching the file's existing convention):

```ts
export * from "./nav-list";
```

- [ ] **Step 7.3: Verify typecheck still passes**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7.4: Commit**

```bash
git add src/components/index.ts
git commit -m "feat(nav-list): export from components barrel"
```

---

## Task 8: Refactor Sidebar to publish NavListModeProvider and delegate Section/Item

The Sidebar's existing tests must continue to pass without modification.

**Files:**
- Modify: `src/components/sidebar/sidebar.tsx`

- [ ] **Step 8.1: Read the current Sidebar source**

Run: `cat src/components/sidebar/sidebar.tsx | head -50`
Confirm the imports at the top of the file.

- [ ] **Step 8.2: Add NavList imports near the top**

Add to the imports block (around lines 1-15):

```tsx
import { NavList } from "../nav-list/nav-list";
import { NavListModeProvider } from "../nav-list/nav-list-context";
```

- [ ] **Step 8.3: Publish NavListModeProvider from SidebarRoot**

Find the `SidebarRoot` component (around line 57) and wrap its returned tree so the Sidebar's `collapsed` value is published on `NavListModeContext`. Inside the existing `<SidebarContext.Provider value={ctx}>`, wrap the contents with `<NavListModeProvider value={{ collapsed }}>`:

```tsx
return (
    <SidebarContext.Provider value={ctx}>
        <NavListModeProvider value={{ collapsed }}>
            <Box ... >
                {/* ...existing contents... */}
            </Box>
        </NavListModeProvider>
    </SidebarContext.Provider>
);
```

- [ ] **Step 8.4: Replace `SidebarSection` body with NavList.Group delegation**

Find `SidebarSection` (lines 197-226) and replace its body with:

```tsx
const SidebarSection = ({ label, children }: SidebarSectionProps) => (
    <NavList.Group label={label}>{children}</NavList.Group>
);
SidebarSection.displayName = "Sidebar.Section";
```

Delete the now-unused `useSidebarContext()` call inside it (the collapsed handling lives in NavList.Group via context).

- [ ] **Step 8.5: Replace `SidebarItem` body with NavList.Item delegation**

Find `SidebarItem` (lines 228-346) and replace the entire component (keep the `SidebarItemProps` interface above it intact) with:

```tsx
const SidebarItem = ({
    icon,
    children,
    asChild,
    active,
    label,
}: SidebarItemProps) => (
    <NavList.Item
        icon={icon}
        active={active}
        asChild={asChild}
        label={label}
    >
        {children}
    </NavList.Item>
);
SidebarItem.displayName = "Sidebar.Item";
```

- [ ] **Step 8.6: Remove now-unused imports**

After the deletions, run:

```bash
npm run typecheck 2>&1 | grep "is declared but its value is never read" || true
```

If `Tooltip` or `Text` (imported only for the inlined active-pill / item styling) are now unused, remove them from the imports. Re-run `npm run typecheck` until clean.

- [ ] **Step 8.7: Run sidebar tests — verify they still pass**

Run: `npm test -- --run src/components/sidebar/sidebar.test.tsx`
Expected: all existing Sidebar tests PASS without modification.

- [ ] **Step 8.8: Visually verify Sidebar story is unchanged**

Run: `npm run dev` and open `http://localhost:6006/?path=/story/components-sidebar--default`. Compare against the previously-committed visual — active item (Users) must show the inset border, primary color, and trailing pill identically. Stop dev server.

- [ ] **Step 8.9: Commit**

```bash
git add src/components/sidebar/sidebar.tsx
git commit -m "refactor(sidebar): delegate Section/Item to shared NavList primitive"
```

---

## Task 9: SubNavLayout — failing test for default structure

**Files:**
- Create: `src/templates/subnav-layout.test.tsx`

- [ ] **Step 9.1: Write the test file**

```tsx
// src/templates/subnav-layout.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NavList } from "../components/nav-list/nav-list";
import { SubNavLayout } from "./subnav-layout";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("SubNavLayout", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("renders Nav and Detail children", () => {
		renderWithChakra(
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Catalogs">
					<NavList.Group label="Page">
						<NavList.Item>Page geometries</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<div data-testid="detail">Detail content</div>
				</SubNavLayout.Detail>
			</SubNavLayout>,
		);
		expect(
			screen.getByRole("navigation", { name: "Catalogs" }),
		).toBeInTheDocument();
		expect(screen.getByText("Page geometries")).toBeInTheDocument();
		expect(screen.getByTestId("detail")).toBeInTheDocument();
	});

	it("renders the collapse toggle with default aria-label", () => {
		renderWithChakra(
			<SubNavLayout>
				<SubNavLayout.Nav>
					<NavList.Group>
						<NavList.Item>X</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>body</SubNavLayout.Detail>
			</SubNavLayout>,
		);
		expect(
			screen.getByRole("button", { name: /collapse sub-nav/i }),
		).toBeInTheDocument();
	});
});
```

- [ ] **Step 9.2: Run — verify it fails**

Run: `npm test -- --run src/templates/subnav-layout.test.tsx`
Expected: FAIL — `Cannot find module './subnav-layout'`.

---

## Task 10: SubNavLayout — minimal implementation

**Files:**
- Create: `src/templates/subnav-layout.tsx`

- [ ] **Step 10.1: Write subnav-layout.tsx**

```tsx
// src/templates/subnav-layout.tsx
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IconButton } from "../atoms/button";
import { NavListModeProvider } from "../components/nav-list/nav-list-context";
import { Box, Grid } from "../primitives/layout";

const EXPANDED_NAV = "220px";
const COLLAPSED_NAV = "56px";

function getInitialCollapsed(
	storageKey: string | undefined,
	defaultCollapsed: boolean | undefined,
): boolean {
	if (typeof window === "undefined") return defaultCollapsed ?? false;
	if (storageKey) {
		const stored = window.localStorage.getItem(storageKey);
		if (stored === "true") return true;
		if (stored === "false") return false;
	}
	return defaultCollapsed ?? false;
}

export interface SubNavLayoutProps {
	storageKey?: string;
	defaultCollapsed?: boolean;
	/** Overrides the toggle's aria-label. */
	toggleAriaLabel?: string;
	children: ReactNode;
}

const SubNavLayoutRoot = ({
	storageKey,
	defaultCollapsed,
	toggleAriaLabel,
	children,
}: SubNavLayoutProps) => {
	const [collapsed, setCollapsed] = useState(() =>
		getInitialCollapsed(storageKey, defaultCollapsed),
	);

	useEffect(() => {
		if (storageKey) {
			window.localStorage.setItem(storageKey, String(collapsed));
		}
	}, [collapsed, storageKey]);

	const toggle = useCallback(() => setCollapsed((c) => !c), []);
	const navMode = useMemo(() => ({ collapsed }), [collapsed]);
	const label =
		toggleAriaLabel ??
		(collapsed ? "Expand sub-nav" : "Collapse sub-nav");

	return (
		<NavListModeProvider value={navMode}>
			<Grid
				data-testid="subnav-layout"
				data-collapsed={collapsed ? "true" : "false"}
				gridTemplateColumns={`${
					collapsed ? COLLAPSED_NAV : EXPANDED_NAV
				} 1fr`}
				alignItems="stretch"
				minH="0"
				flex="1"
				position="relative"
				transition="grid-template-columns 250ms ease-out"
			>
				{children}
				<IconButton
					data-testid="subnav-toggle"
					aria-label={label}
					onClick={toggle}
					variant="outline"
					size="xs"
					position="absolute"
					top="3"
					left={collapsed ? "44px" : "208px"} /* visually centered on the divider */
					width="7"
					height="7"
					minW="7"
					borderRadius="full"
					bg="bg-surface"
					borderColor="border"
					boxShadow="sm"
					zIndex={4}
					_hover={{ bg: "bg-muted" }}
					transition="left 250ms ease-out"
				>
					{collapsed ? (
						<PanelLeftOpen size={14} />
					) : (
						<PanelLeftClose size={14} />
					)}
				</IconButton>
			</Grid>
		</NavListModeProvider>
	);
};
SubNavLayoutRoot.displayName = "SubNavLayout";

export interface SubNavLayoutNavProps {
	"aria-label"?: string;
	children: ReactNode;
}

const SubNavLayoutNav = ({ children, ...rest }: SubNavLayoutNavProps) => (
	<Box
		as="nav"
		aria-label={rest["aria-label"]}
		data-testid="subnav-layout-nav"
		py="3"
		px="1"
		minW="0"
	>
		{children}
	</Box>
);
SubNavLayoutNav.displayName = "SubNavLayout.Nav";

export interface SubNavLayoutDetailProps {
	children: ReactNode;
}

const SubNavLayoutDetail = ({ children }: SubNavLayoutDetailProps) => (
	<Box
		data-testid="subnav-layout-detail"
		borderLeftWidth="1px"
		borderColor="border"
		minW="0"
		display="flex"
		flexDirection="column"
	>
		{children}
	</Box>
);
SubNavLayoutDetail.displayName = "SubNavLayout.Detail";

export interface SubNavLayoutToolbarProps {
	children: ReactNode;
}

const SubNavLayoutToolbar = ({ children }: SubNavLayoutToolbarProps) => (
	<Box
		data-testid="subnav-layout-toolbar"
		display="flex"
		alignItems="center"
		gap="3"
		px="5"
		py="3"
		borderBottomWidth="1px"
		borderColor="border-muted"
		bg="bg-canvas"
	>
		{children}
	</Box>
);
SubNavLayoutToolbar.displayName = "SubNavLayout.Toolbar";

export const SubNavLayout = Object.assign(SubNavLayoutRoot, {
	Nav: SubNavLayoutNav,
	Detail: SubNavLayoutDetail,
	Toolbar: SubNavLayoutToolbar,
});
```

- [ ] **Step 10.2: Run Task 9 tests — verify they pass**

Run: `npm test -- --run src/templates/subnav-layout.test.tsx`
Expected: 2 tests PASS.

- [ ] **Step 10.3: Commit**

```bash
git add src/templates/subnav-layout.tsx
git commit -m "feat(subnav-layout): add SubNavLayout template with Nav/Detail/Toolbar"
```

---

## Task 11: SubNavLayout — collapse / persistence / toolbar tests

**Files:**
- Modify: `src/templates/subnav-layout.test.tsx`

- [ ] **Step 11.1: Append the tests**

Add inside the existing `describe`:

```tsx
	it("toggles collapsed state on toggle button click", () => {
		renderWithChakra(
			<SubNavLayout>
				<SubNavLayout.Nav>
					<NavList.Group>
						<NavList.Item>X</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>body</SubNavLayout.Detail>
			</SubNavLayout>,
		);
		const root = screen.getByTestId("subnav-layout");
		expect(root).toHaveAttribute("data-collapsed", "false");
		fireEvent.click(screen.getByTestId("subnav-toggle"));
		expect(root).toHaveAttribute("data-collapsed", "true");
		expect(
			screen.getByRole("button", { name: /expand sub-nav/i }),
		).toBeInTheDocument();
	});

	it("persists collapsed state to localStorage when storageKey is set", () => {
		const { unmount } = renderWithChakra(
			<SubNavLayout storageKey="catalogs-subnav">
				<SubNavLayout.Nav>
					<NavList.Group>
						<NavList.Item>X</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>body</SubNavLayout.Detail>
			</SubNavLayout>,
		);
		fireEvent.click(screen.getByTestId("subnav-toggle"));
		expect(window.localStorage.getItem("catalogs-subnav")).toBe("true");
		unmount();

		renderWithChakra(
			<SubNavLayout storageKey="catalogs-subnav">
				<SubNavLayout.Nav>
					<NavList.Group>
						<NavList.Item>X</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>body</SubNavLayout.Detail>
			</SubNavLayout>,
		);
		expect(screen.getByTestId("subnav-layout")).toHaveAttribute(
			"data-collapsed",
			"true",
		);
	});

	it("propagates collapsed mode to NavList children", () => {
		renderWithChakra(
			<SubNavLayout defaultCollapsed>
				<SubNavLayout.Nav>
					<NavList.Group label="Page">
						<NavList.Item count={5}>Master pages</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>body</SubNavLayout.Detail>
			</SubNavLayout>,
		);
		// label hidden, item text hidden, count hidden
		expect(screen.queryByText("Page")).not.toBeInTheDocument();
		expect(screen.queryByText("Master pages")).not.toBeInTheDocument();
		expect(screen.queryByText("5")).not.toBeInTheDocument();
	});

	it("respects toggleAriaLabel override", () => {
		renderWithChakra(
			<SubNavLayout toggleAriaLabel="Collapse catalogs sub-nav">
				<SubNavLayout.Nav>
					<NavList.Group>
						<NavList.Item>X</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>body</SubNavLayout.Detail>
			</SubNavLayout>,
		);
		expect(
			screen.getByRole("button", { name: "Collapse catalogs sub-nav" }),
		).toBeInTheDocument();
	});

	it("renders Toolbar inside Detail with bottom border", () => {
		renderWithChakra(
			<SubNavLayout>
				<SubNavLayout.Nav>
					<NavList.Group>
						<NavList.Item>X</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<SubNavLayout.Toolbar>
						<button>Add</button>
					</SubNavLayout.Toolbar>
					<div>rest</div>
				</SubNavLayout.Detail>
			</SubNavLayout>,
		);
		expect(screen.getByTestId("subnav-layout-toolbar")).toContainElement(
			screen.getByRole("button", { name: "Add" }),
		);
	});
```

- [ ] **Step 11.2: Run — verify they pass**

Run: `npm test -- --run src/templates/subnav-layout.test.tsx`
Expected: 7 tests PASS.

- [ ] **Step 11.3: Commit**

```bash
git add src/templates/subnav-layout.test.tsx
git commit -m "test(subnav-layout): cover toggle, persistence, propagation, toolbar"
```

---

## Task 12: SubNavLayout stories

**Files:**
- Create: `src/templates/subnav-layout.stories.tsx`

- [ ] **Step 12.1: Write the stories file**

```tsx
// src/templates/subnav-layout.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import {
	AlignVerticalJustifyCenter,
	FileText,
	Newspaper,
	Palette,
	Plus,
	Type,
} from "lucide-react";
import { Button } from "../atoms/button";
import { NavList } from "../components/nav-list/nav-list";
import { Box, Flex } from "../primitives/layout";
import { Text } from "../primitives/typography";
import { SubNavLayout } from "./subnav-layout";

const meta = {
	title: "Templates/SubNavLayout",
	component: SubNavLayout,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SubNavLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const Nav = () => (
	<>
		<NavList.Group label="Page">
			<NavList.Item icon={<FileText size={14} />} count={1}>
				Page geometries
			</NavList.Item>
			<NavList.Item icon={<Newspaper size={14} />} count={5}>
				Master pages
			</NavList.Item>
		</NavList.Group>
		<NavList.Group label="Typography">
			<NavList.Item icon={<Type size={14} />} count={2}>
				Fonts
			</NavList.Item>
			<NavList.Item
				icon={<AlignVerticalJustifyCenter size={14} />}
				count={10}
				active
			>
				Glue patterns
			</NavList.Item>
		</NavList.Group>
		<NavList.Group label="Visual">
			<NavList.Item icon={<Palette size={14} />} count={5}>
				Colors
			</NavList.Item>
		</NavList.Group>
	</>
);

const DetailBody = ({ rows = 10 }: { rows?: number }) => (
	<Box p="5">
		<Text fontSize="md" fontWeight="semibold" mb="2">
			Glue patterns
		</Text>
		<Text fontSize="sm" color="muted" mb="4">
			{rows} patterns · used by 47 styles
		</Text>
		<Box bg="bg-surface" borderWidth="1px" borderColor="border" borderRadius="sm">
			{Array.from({ length: rows }).map((_, i) => (
				<Flex
					key={i}
					px="3"
					py="2"
					borderBottomWidth={i === rows - 1 ? "0" : "1px"}
					borderColor="border-muted"
					justify="space-between"
				>
					<Text fontSize="sm">pattern-{i + 1}</Text>
					<Text fontSize="sm" color="muted">
						{(i + 1) * 1.2}pt
					</Text>
				</Flex>
			))}
		</Box>
	</Box>
);

export const Default: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const CollapsedByDefault: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout defaultCollapsed>
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const NoGroups: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Flat">
					<NavList.Group>
						<NavList.Item icon={<FileText size={14} />}>One</NavList.Item>
						<NavList.Item icon={<Newspaper size={14} />} active>
							Two
						</NavList.Item>
						<NavList.Item icon={<Type size={14} />}>Three</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody rows={3} />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const WithoutToolbar: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const WithToolbar: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout storageKey="storybook-subnav-with-toolbar">
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<SubNavLayout.Toolbar>
						<input
							placeholder="Filter patterns…"
							style={{
								height: 30,
								width: 240,
								border: "1px solid var(--chakra-colors-gray-300)",
								borderRadius: 4,
								padding: "0 10px",
								fontSize: 13,
							}}
						/>
						<Text fontSize="xs" color="muted">
							10 patterns · ordered by usage
						</Text>
						<Box ml="auto">
							<Button colorPalette="primary" size="sm">
								<Plus size={14} /> Add pattern
							</Button>
						</Box>
					</SubNavLayout.Toolbar>
					<DetailBody />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const LongDetailContent: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody rows={30} />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const AsChildRouter: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Routes">
					<NavList.Group label="Typography">
						<NavList.Item
							icon={<AlignVerticalJustifyCenter size={14} />}
							active
							asChild
						>
							<a href="#glue">Glue patterns</a>
						</NavList.Item>
						<NavList.Item icon={<Type size={14} />} asChild>
							<a href="#fonts">Fonts</a>
						</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody rows={3} />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};
```

- [ ] **Step 12.2: Verify Storybook builds**

Run: `npm run dev` and open `http://localhost:6006/?path=/story/templates-subnavlayout--default`. Click through all 7 stories. Stop dev server.

- [ ] **Step 12.3: Commit**

```bash
git add src/templates/subnav-layout.stories.tsx
git commit -m "docs(subnav-layout): add storybook stories"
```

---

## Task 13: Export SubNavLayout from templates barrel

**Files:**
- Modify: `src/templates/index.ts`

- [ ] **Step 13.1: Add the export**

Run: `cat src/templates/index.ts`
Insert in alphabetical position (after `settings-page-template`, matching the file's convention):

```ts
export * from "./subnav-layout";
```

- [ ] **Step 13.2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 13.3: Commit**

```bash
git add src/templates/index.ts
git commit -m "feat(subnav-layout): export from templates barrel"
```

---

## Task 14: Update page-patterns.md

**Files:**
- Modify: `docs/page-patterns.md`

- [ ] **Step 14.1: Inspect existing section structure**

Run: `grep -n "^##" docs/page-patterns.md`
Confirm § 3 Sidebar IA and § 7 Tab patterns exist; note the line number where § 7 ends (the next `^##` line tells you where to insert § 8).

- [ ] **Step 14.2: Add the cross-reference paragraph in § 3 Sidebar IA**

Find the end of `### `<Sidebar.Item>` structure` subsection. Append immediately after the existing prose (before the next `###`):

```markdown
Sidebar's section + item rendering is implemented via the shared `<NavList>` primitive in `@knkcs/anker/components`. The same primitive powers `<SubNavLayout>` (see § 8 Sub-nav layout). If you need the visual standalone — group label + icon row + count + active pill — import `<NavList>` directly.
```

- [ ] **Step 14.3: Add new § 8 Sub-nav layout after § 7 Tab patterns**

Find the line after § 7 ends (the next `^## ` or EOF). Insert:

```markdown
## 8. Sub-nav layout

`<SubNavLayout>` is the inner layout primitive for **multi-resource navigation inside a `<DetailPageTemplate>` tab body**: a grouped vertical nav on the left and a detail pane on the right, separated by a vertical divider with a collapse toggle.

It is distinct from:
- `<Sidebar>` (page-level chrome owned by `<AppShell>`)
- Tabs in `<PageHeader>` (page-level navigation between tab bodies)
- `<ContextRail>` (optional third column to the right)

### Composition

```
AppShell
├── Sidebar
├── DetailPageTemplate
│   └── tab body
│       └── SubNavLayout
│           ├── .Nav     (NavList.Group × N)
│           └── .Detail
│               ├── .Toolbar (optional)
│               └── children (DataTable, editor, …)
└── ContextRail   (optional)
```

`<SubNavLayout>` sits flush in the main column — no card wrapper, no padding, no border on the layout root. The divider between Nav and Detail is `border-left: 1px solid border` on `.Detail`.

### When to use

- A tab body has 2+ resource categories of different types (e.g. Catalogs = page geometries / fonts / glue / colors / master pages).
- Each category has its own table or editor.
- The active category benefits from URL deep-linking (e.g. `/catalogs/glue`).

### When not to use

- The tab body is one homogeneous list — use `<DataTable>` directly.
- The categories are filters of one underlying list — use filter chips in `<Toolbar>`.
- The categories are independent destinations with their own page chrome — those belong as siblings in `<Sidebar>`, not inside a sub-nav.

### Geometry

| Element | Expanded | Collapsed |
|---|---|---|
| `.Nav` width | `220px` | `56px` |
| `.Detail` width | `1fr` | `1fr` |
| Transition | `grid-template-columns 250ms ease-out` | — |

### Collapse behavior

`<SubNavLayout storageKey="…">` persists collapse state to `localStorage`. Item labels, group labels, counts, and the active pill hide when collapsed; the icon centers and a `<Tooltip>` shows the label on hover. The toggle button uses `PanelLeftClose` / `PanelLeftOpen` icons and floats centered on the divider.

**Storage-key convention:** `<feature>-subnav` (e.g. `catalogs-subnav`). Avoid colliding with `<Sidebar>` keys (`<feature>-sidebar`) and `<ContextRail>` keys (`<feature>-rail`).

### Three-column example

```tsx
<AppShell sidebar={<MySidebar />} rail={<MyContextRail />}>
  <DetailPageTemplate
    breadcrumbs={…}
    title="Boorberg Standard"
    badges={…}
    tabs={<CatalogsTabs />}
  >
    <SubNavLayout storageKey="catalogs-subnav">
      <SubNavLayout.Nav aria-label="Catalogs sub-navigation">
        <NavList.Group label="Page">…</NavList.Group>
        <NavList.Group label="Typography">…</NavList.Group>
        <NavList.Group label="Visual">…</NavList.Group>
      </SubNavLayout.Nav>

      <SubNavLayout.Detail>
        <SubNavLayout.Toolbar>
          <Input placeholder="Filter patterns…" />
          <Text fontSize="xs" color="muted">10 patterns · ordered by usage</Text>
          <Button colorPalette="primary" ml="auto">+ Add pattern</Button>
        </SubNavLayout.Toolbar>
        <DataTable … />
      </SubNavLayout.Detail>
    </SubNavLayout>
  </DetailPageTemplate>
</AppShell>
```
```

- [ ] **Step 14.4: Commit**

```bash
git add docs/page-patterns.md
git commit -m "docs(page-patterns): add § 8 Sub-nav layout"
```

---

## Task 15: Update CLAUDE.md (project) and CLAUDE-ANKER.md (consumer)

**Files:**
- Modify: `CLAUDE.md`
- Modify: `CLAUDE-ANKER.md`

- [ ] **Step 15.1: Inspect existing CLAUDE.md template count**

Run: `grep -n "template\|template count\|templates" CLAUDE.md | head -20`
Find the line documenting how many templates exist (search for the phrase that lists template names or the count).

- [ ] **Step 15.2: Add SubNavLayout to CLAUDE.md**

In the **Package Structure** § 3 list ("Higher-level composites:"), update the components paragraph to include the new entries. Add to the Component Scaffolding Checklist a new entry after the existing **Component (higher-level composite)** entry:

```markdown
### Sub-nav template (`<SubNavLayout>`)
1. Create `src/templates/subnav-layout.tsx`
2. Use `<NavList>` from `src/components/nav-list/` for the left column — same primitive `<Sidebar>` uses
3. Publish `NavListModeProvider` from the layout root so items collapse with the layout
4. Persist collapse via `storageKey` to `localStorage`, like `<Sidebar>` / `<ContextRail>`
```

- [ ] **Step 15.3: Update CLAUDE-ANKER.md**

Run: `grep -n "Page templates\|templates" CLAUDE-ANKER.md | head -10`

Find the "Page templates" section. Append:

```markdown
- For multi-resource navigation inside a tab body, use `<SubNavLayout>` rather than rolling your own master-detail. It owns collapse state, persistence, and the divider — wire `<NavList.Item asChild>` to `<NavLink>` for URL deep-linking.
```

- [ ] **Step 15.4: Commit**

```bash
git add CLAUDE.md CLAUDE-ANKER.md
git commit -m "docs(claude): document SubNavLayout and NavList"
```

---

## Task 16: Full verification before PR

- [ ] **Step 16.1: Run lint**

Run: `npm run lint`
Expected: PASS. If Biome reports issues, run `npm run lint:write` and inspect the diff. Commit fixes with `style: biome auto-fix`.

- [ ] **Step 16.2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 16.3: Run full test suite**

Run: `npm test -- --run`
Expected: all tests pass — Sidebar tests pass unchanged, new NavList and SubNavLayout tests pass.

- [ ] **Step 16.4: Run build**

Run: `npm run build`
Expected: tsup produces `dist/` with `nav-list` and `subnav-layout` entries.

- [ ] **Step 16.5: Visual smoke test in Storybook**

Run: `npm run dev`. Open in the browser:
- `http://localhost:6006/?path=/story/components-sidebar--default` — verify the Sidebar's active item is visually identical to main (inset border, primary color, trailing pill).
- `http://localhost:6006/?path=/story/components-navlist--default` — verify all 4 NavList stories render correctly.
- `http://localhost:6006/?path=/story/templates-subnavlayout--default` — verify all 7 SubNavLayout stories; click the toggle on Default and confirm collapse/expand animation, label and count hide, tooltip on hover.

Stop the dev server.

- [ ] **Step 16.6: Open the PR**

```bash
git push -u origin feat/subnav-layout
gh pr create --title "feat: add <SubNavLayout> template + shared <NavList> primitive" --body "$(cat <<'EOF'
## Summary

- Adds `<SubNavLayout>` template (issue #124) for in-tab sub-nav + detail-pane layouts inside `<DetailPageTemplate>` bodies.
- Extracts the icon-row-with-active-pill pattern from `<Sidebar>` into a shared `<NavList>` primitive. Both `<Sidebar>` and `<SubNavLayout>` now consume the same visual contract.
- Persists collapse state to `localStorage` via `storageKey`, matching `<Sidebar>` / `<ContextRail>` conventions.

Single PR per project owner's request — the NavList extraction and SubNavLayout addition ship together.

Closes #124.

## Test plan

- [ ] Sidebar stories render visually identical to main (active item: inset border, primary.700, trailing pill).
- [ ] NavList stories: Default, WithoutGroupLabels, Collapsed (icon-only with tooltips), AsChildLink.
- [ ] SubNavLayout stories: Default, CollapsedByDefault, NoGroups, WithoutToolbar, WithToolbar, LongDetailContent, AsChildRouter.
- [ ] Toggle button flips state; aria-label flips between Collapse / Expand.
- [ ] `storageKey` round-trips through unmount/remount.
- [ ] In collapsed mode, item labels / counts / active pill hide; group labels hide.

Spec: `docs/superpowers/specs/2026-05-18-subnav-layout-design.md`
Plan: `docs/superpowers/plans/2026-05-18-subnav-layout.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Notes for the implementing engineer

- **DRY:** The visual contract for active state lives in exactly one place — `NavList.Item` in `src/components/nav-list/nav-list.tsx`. If you find yourself copying the inset-shadow / pill code anywhere else, stop and reuse `<NavList.Item>` instead.
- **YAGNI:** Don't add per-item `onClick` props, controlled-state escape hatches, or animation knobs to `<SubNavLayout>` in this PR — the issue scope is the visual primitive plus collapse persistence. Future enhancements live in their own issues.
- **TDD discipline:** Every component task in this plan writes the failing test first, sees it fail, then implements. Don't skip the "verify it fails" step — it confirms your test is actually exercising the new code path.
- **Frequent commits:** Each task ends in a commit. Don't squash mid-plan. The PR can be squash-merged at the end if the project prefers that.
- **No new error handling:** Trust the contracts. `storageKey` is opt-in; `defaultCollapsed` is optional; `aria-label` is optional on the `<nav>`. No validation, no warnings, no fallbacks beyond what the spec specifies.
