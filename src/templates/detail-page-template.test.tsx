// src/templates/detail-page-template.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { Tabs } from "../primitives/tabs";
import { AppShell, usePageActions } from "./app-shell";
import { DetailPageTemplate } from "./detail-page-template";

function renderWithChakra(ui: ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("DetailPageTemplate", () => {
	it("renders the title", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="Jana Schmid">
					<div>body</div>
				</DetailPageTemplate>
			</AppShell>,
		);
		expect(
			screen.getByRole("heading", { name: "Jana Schmid" }),
		).toBeInTheDocument();
	});

	it("renders the body children", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="Jana Schmid">
					<div data-testid="body">body</div>
				</DetailPageTemplate>
			</AppShell>,
		);
		expect(screen.getByTestId("body")).toBeInTheDocument();
	});

	it("renders the body flush (no horizontal padding) by default", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="Jana Schmid">
					<div data-testid="body">body</div>
				</DetailPageTemplate>
			</AppShell>,
		);
		// The body wrapper is the parent of the children — it must not carry
		// inline padding styles. The previous implementation passed
		// `px="8" pt="6"` to the wrapper Box; the flush default does not.
		// We assert the absence of any inline padding so the body sits flush
		// against the canvas (matching IndexPageTemplate).
		const body = screen.getByTestId("body");
		const wrapper = body.parentElement as HTMLElement;
		expect(wrapper.getAttribute("style") ?? "").not.toMatch(/padding/);
	});

	it("renders the tabs slot inside the registered header", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate
					title="Jana Schmid"
					tabs={<div data-testid="tabs">tabs</div>}
				>
					<div>body</div>
				</DetailPageTemplate>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(within(header).getByTestId("tabs")).toBeInTheDocument();
	});

	it("forwards avatar, badges, meta, and tabs into the registered PageHeader", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate
					title="Jana Schmid"
					avatar={<div data-testid="av">JS</div>}
					badges={<span data-testid="bd">Aktiv</span>}
					meta={<span data-testid="mt">jana@example.test</span>}
					tabs={<div data-testid="tb">tab list</div>}
				>
					body
				</DetailPageTemplate>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(within(header).getByTestId("av")).toBeInTheDocument();
		expect(within(header).getByTestId("bd")).toBeInTheDocument();
		expect(within(header).getByTestId("mt")).toBeInTheDocument();
		expect(within(header).getByTestId("tb")).toBeInTheDocument();
	});
});

describe("DetailPageTemplate — sticky header", () => {
	it("renders a sticky header by default", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="X">body</DetailPageTemplate>
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell-header")).toHaveAttribute(
			"data-sticky-header",
			"true",
		);
	});

	it("opts out when stickyHeader={false}", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="X" stickyHeader={false}>
					body
				</DetailPageTemplate>
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell-header")).toHaveAttribute(
			"data-sticky-header",
			"false",
		);
	});
});

// Characterization tests for the "one mounted usePageActions caller" rule in
// CLAUDE-ANKER.md (#175). The rule used to say "don't own a Tabs.Root — use
// bodyTabs", but bodyTabs was removed in 2.2.0 and took its
// `lazyMount unmountOnExit` guard with it. Nothing in the template enforces the
// invariant now, so both the hazard and the two ways of avoiding it are pinned
// here.
//
// The two "shows the wrong action" tests deliberately assert the footgun. If
// the actions slot ever becomes keyed by caller, they will fail — that is the
// point: the rule they back would no longer be true and must be rewritten too.

/** A tab body that lifts its own primary action into the page header. */
function TabBody({ label }: { label: string }) {
	usePageActions(<button type="button">{`Add ${label}`}</button>);
	return <div>{`${label} body`}</div>;
}

/** Re-render through the same provider wrapper `renderWithChakra` installs. */
function rerenderWithChakra(
	rerender: (ui: ReactElement) => void,
	ui: ReactElement,
) {
	rerender(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("DetailPageTemplate — usePageActions collision", () => {
	it("shows the wrong action when two tab bodies are mounted at once", () => {
		// The actions slot holds a single unkeyed registration, so mounted
		// callers overwrite each other. Panel A is the active tab, but the
		// header ends up showing panel B's button — the "stuck Add button".
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="Jana Schmid">
					<TabBody label="A" />
					<TabBody label="B" />
				</DetailPageTemplate>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(within(header).queryByText("Add A")).not.toBeInTheDocument();
		expect(within(header).getByText("Add B")).toBeInTheDocument();
	});

	it("shows the active tab's action for nav-link tabs", () => {
		// The prescribed shape: a Tabs.Root holding only a Tabs.List goes to
		// `tabs`, and the router renders exactly one panel as `children`, so
		// exactly one registration is ever alive.
		const navTabs = (current: string) => (
			<Tabs.Root value={current}>
				<Tabs.List>
					<Tabs.Trigger value="a">A</Tabs.Trigger>
					<Tabs.Trigger value="b">B</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		);
		const { rerender } = renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="Jana Schmid" tabs={navTabs("a")}>
					<TabBody label="A" />
				</DetailPageTemplate>
			</AppShell>,
		);
		let header = screen.getByTestId("app-shell-header");
		expect(within(header).getByText("Add A")).toBeInTheDocument();
		expect(within(header).queryByText("Add B")).not.toBeInTheDocument();

		// Navigating to the sibling route swaps the panel — and the action.
		rerenderWithChakra(
			rerender,
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="Jana Schmid" tabs={navTabs("b")}>
					<TabBody label="B" />
				</DetailPageTemplate>
			</AppShell>,
		);
		header = screen.getByTestId("app-shell-header");
		expect(within(header).getByText("Add B")).toBeInTheDocument();
		expect(within(header).queryByText("Add A")).not.toBeInTheDocument();
	});

	it("shows the active tab's action for a body-owned Tabs.Root with lazyMount unmountOnExit", () => {
		// The escape hatch for self-contained body tabs: the consumer restores
		// the invariant by mounting only the active panel.
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="Jana Schmid">
					<Tabs.Root defaultValue="a" lazyMount unmountOnExit>
						<Tabs.List>
							<Tabs.Trigger value="a">A</Tabs.Trigger>
							<Tabs.Trigger value="b">B</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="a">
							<TabBody label="A" />
						</Tabs.Content>
						<Tabs.Content value="b">
							<TabBody label="B" />
						</Tabs.Content>
					</Tabs.Root>
				</DetailPageTemplate>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(within(header).getByText("Add A")).toBeInTheDocument();
		expect(within(header).queryByText("Add B")).not.toBeInTheDocument();
	});

	it("shows the wrong action for a body-owned Tabs.Root without the guard", () => {
		// Same markup, guard omitted: Chakra keeps the inactive panel mounted,
		// so its registration overwrites the active tab's.
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate title="Jana Schmid">
					<Tabs.Root defaultValue="a">
						<Tabs.List>
							<Tabs.Trigger value="a">A</Tabs.Trigger>
							<Tabs.Trigger value="b">B</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="a">
							<TabBody label="A" />
						</Tabs.Content>
						<Tabs.Content value="b">
							<TabBody label="B" />
						</Tabs.Content>
					</Tabs.Root>
				</DetailPageTemplate>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(within(header).queryByText("Add A")).not.toBeInTheDocument();
		expect(within(header).getByText("Add B")).toBeInTheDocument();
	});
});
