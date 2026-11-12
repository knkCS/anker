// src/components/context-rail/context-rail-tabs.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextRail, type ContextRailTabIndicator } from "./context-rail";

const KEY = "test.tabs-rail";

interface RailProps {
	value: string;
	onValueChange?: (value: string) => void;
	expandOn?: unknown;
	storageKey?: string;
	branchIndicator?: ContextRailTabIndicator;
	fieldIndicator?: ContextRailTabIndicator;
}

function ui({
	value,
	onValueChange = () => {},
	expandOn,
	storageKey,
	branchIndicator,
	fieldIndicator,
}: RailProps) {
	return (
		<ChakraProvider value={defaultSystem}>
			<ContextRail storageKey={storageKey} expandOn={expandOn}>
				<ContextRail.Header title="Rail" />
				<ContextRail.Tabs
					label="Rail tabs"
					value={value}
					onValueChange={onValueChange}
				>
					<ContextRail.Tab
						value="branch"
						label="Branch"
						icon={<span>B</span>}
						indicator={branchIndicator}
					>
						<ContextRail.Section id="actions" label="Actions">
							<div data-testid="branch-body">blockers</div>
							<ContextRail.IconButton label="Publish" icon={<span>P</span>} />
						</ContextRail.Section>
					</ContextRail.Tab>
					<ContextRail.Tab
						value="field"
						label="Field"
						icon={<span>F</span>}
						indicator={fieldIndicator}
					>
						<ContextRail.Section id="inspector" label="Inspector">
							<div data-testid="field-body">inspector</div>
						</ContextRail.Section>
					</ContextRail.Tab>
				</ContextRail.Tabs>
			</ContextRail>
		</ChakraProvider>
	);
}

function renderRail(props: RailProps) {
	const result = render(ui(props));
	return { ...result, update: (next: RailProps) => result.rerender(ui(next)) };
}

/** A rail whose tab is the caller's state, as a screen would hold it. */
function Stateful({
	initial = "branch",
	onValueChange,
}: {
	initial?: string;
	onValueChange?: (value: string) => void;
}) {
	const [value, setValue] = useState(initial);
	return ui({
		value,
		onValueChange: (next) => {
			onValueChange?.(next);
			setValue(next);
		},
	});
}

function collapsedAttr() {
	return screen.getByTestId("context-rail").getAttribute("data-collapsed");
}

function setViewport(width: number) {
	Object.defineProperty(window, "innerWidth", {
		value: width,
		configurable: true,
	});
}

describe("ContextRail.Tabs, expanded", () => {
	beforeEach(() => {
		localStorage.clear();
		setViewport(1600);
	});
	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	it("renders a tablist with a tab per ContextRail.Tab and one tabpanel", () => {
		renderRail({ value: "branch" });
		const tablist = screen.getByRole("tablist", { name: "Rail tabs" });
		const tabs = within(tablist).getAllByRole("tab");
		expect(tabs).toEqual([
			within(tablist).getByRole("tab", { name: "Branch" }),
			within(tablist).getByRole("tab", { name: "Field" }),
		]);
		const panel = screen.getByRole("tabpanel");
		expect(tabs[0]).toHaveAttribute("aria-selected", "true");
		expect(tabs[1]).toHaveAttribute("aria-selected", "false");
		expect(tabs[0]).toHaveAttribute("aria-controls", panel.id);
		expect(panel).toHaveAttribute("aria-labelledby", tabs[0].id);
	});

	it("renders only the selected tab's sections", () => {
		const rail = renderRail({ value: "branch" });
		expect(screen.getByTestId("branch-body")).toBeInTheDocument();
		expect(screen.queryByTestId("field-body")).toBeNull();
		rail.update({ value: "field" });
		expect(screen.queryByTestId("branch-body")).toBeNull();
		expect(screen.getByTestId("field-body")).toBeInTheDocument();
	});

	it("value controls the selection: a click only reports, the caller decides", async () => {
		const onValueChange = vi.fn();
		const user = userEvent.setup();
		renderRail({ value: "branch", onValueChange });
		await user.click(screen.getByRole("tab", { name: "Field" }));
		expect(onValueChange).toHaveBeenCalledWith("field");
		// Not applied by the caller, so the selection stays.
		expect(screen.getByRole("tab", { name: "Branch" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByTestId("branch-body")).toBeInTheDocument();
	});

	it("switches by click when the caller applies the value", async () => {
		const user = userEvent.setup();
		render(<Stateful />);
		await user.click(screen.getByRole("tab", { name: "Field" }));
		expect(screen.getByRole("tab", { name: "Field" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByTestId("field-body")).toBeInTheDocument();
	});

	it("does not report a click on the tab already selected", async () => {
		const onValueChange = vi.fn();
		const user = userEvent.setup();
		renderRail({ value: "branch", onValueChange });
		await user.click(screen.getByRole("tab", { name: "Branch" }));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("moves between tabs with the arrow keys, wrapping, and with Home/End", async () => {
		const onValueChange = vi.fn();
		const user = userEvent.setup();
		render(<Stateful onValueChange={onValueChange} />);
		const branch = screen.getByRole("tab", { name: "Branch" });
		const field = screen.getByRole("tab", { name: "Field" });
		// Roving tabindex: only the selected tab is in the tab order.
		expect(branch).toHaveAttribute("tabindex", "0");
		expect(field).toHaveAttribute("tabindex", "-1");

		branch.focus();
		await user.keyboard("{ArrowRight}");
		expect(onValueChange).toHaveBeenLastCalledWith("field");
		expect(field).toHaveFocus();
		expect(field).toHaveAttribute("aria-selected", "true");
		expect(screen.getByTestId("field-body")).toBeInTheDocument();

		await user.keyboard("{ArrowRight}");
		expect(onValueChange).toHaveBeenLastCalledWith("branch");
		expect(branch).toHaveFocus();

		await user.keyboard("{ArrowLeft}");
		expect(field).toHaveFocus();
		await user.keyboard("{Home}");
		expect(branch).toHaveFocus();
		await user.keyboard("{End}");
		expect(field).toHaveFocus();
	});

	it("falls back to the first tab when value names no tab", () => {
		renderRail({ value: "gone" });
		expect(screen.getByRole("tab", { name: "Branch" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByTestId("branch-body")).toBeInTheDocument();
	});

	it("shows a badge's count, with its label in the tab's accessible name", () => {
		renderRail({
			value: "field",
			branchIndicator: { kind: "badge", count: 3, label: "3 blockers" },
		});
		const tab = screen.getByRole("tab", { name: "Branch, 3 blockers" });
		expect(within(tab).getByTestId("context-rail-tab-badge")).toHaveTextContent(
			"3",
		);
	});

	it("shows a dot on its tab, with its label in the tab's accessible name", () => {
		renderRail({
			value: "branch",
			fieldIndicator: { kind: "dot", label: "A field has focus" },
		});
		const tab = screen.getByRole("tab", { name: "Field, A field has focus" });
		expect(within(tab).getByTestId("context-rail-tab-dot")).toBeInTheDocument();
	});

	it("shows no indicator when none is set, nor a badge with a count of zero", () => {
		renderRail({
			value: "branch",
			branchIndicator: { kind: "badge", count: 0, label: "0 blockers" },
		});
		expect(screen.getByRole("tab", { name: "Branch" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Field" })).toBeInTheDocument();
		expect(screen.queryByTestId("context-rail-tab-badge")).toBeNull();
		expect(screen.queryByTestId("context-rail-tab-dot")).toBeNull();
	});
});

describe("ContextRail.Tabs, collapsed", () => {
	beforeEach(() => {
		localStorage.clear();
		// A laptop: below the 1440px breakpoint the rail starts collapsed.
		setViewport(1024);
	});
	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	it("renders each tab as an icon button and no tablist", () => {
		renderRail({ value: "branch" });
		expect(collapsedAttr()).toBe("true");
		expect(screen.queryByRole("tablist")).toBeNull();
		const group = screen.getByTestId("context-rail-tabs-collapsed");
		const buttons = within(group).getAllByRole("button");
		expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
			"Branch",
			"Field",
		]);
	});

	it("carries the indicator on the icon and its label in the button's name", () => {
		renderRail({
			value: "branch",
			branchIndicator: { kind: "badge", count: 2, label: "2 blockers" },
			fieldIndicator: { kind: "dot", label: "A field has focus" },
		});
		const branch = screen.getByRole("button", { name: "Branch, 2 blockers" });
		expect(
			within(branch).getByTestId("context-rail-tab-badge"),
		).toHaveTextContent("2");
		const field = screen.getByRole("button", {
			name: "Field, A field has focus",
		});
		expect(
			within(field).getByTestId("context-rail-tab-dot"),
		).toBeInTheDocument();
	});

	it("activating a tab's button expands the rail on that tab, stored like the toggle", async () => {
		const onValueChange = vi.fn();
		const user = userEvent.setup();
		render(
			<ChakraProvider value={defaultSystem}>
				<StatefulKeyed onValueChange={onValueChange} />
			</ChakraProvider>,
		);
		await user.click(screen.getByRole("button", { name: "Field" }));
		expect(onValueChange).toHaveBeenCalledWith("field");
		expect(collapsedAttr()).toBe("false");
		expect(localStorage.getItem(KEY)).toBe("false");
		expect(screen.getByRole("tab", { name: "Field" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByTestId("field-body")).toBeInTheDocument();
	});

	it("activating the selected tab's button expands without reporting a change", async () => {
		const onValueChange = vi.fn();
		const user = userEvent.setup();
		renderRail({ value: "branch", onValueChange });
		await user.click(screen.getByRole("button", { name: "Branch" }));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(collapsedAttr()).toBe("false");
	});

	it("keeps the selected tab's compact atoms below the tab buttons", () => {
		const rail = renderRail({ value: "branch" });
		expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
		expect(screen.queryByTestId("branch-body")).toBeNull();
		// The Field tab holds no atoms, so nothing follows its buttons.
		rail.update({ value: "field" });
		expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
		expect(screen.queryByTestId("context-rail-divider")).toBeNull();
	});

	it("expandOn expands a collapsed rail with tabs as it does without", () => {
		const rail = renderRail({ value: "branch", expandOn: undefined });
		expect(collapsedAttr()).toBe("true");
		rail.update({ value: "branch", expandOn: "x" });
		expect(collapsedAttr()).toBe("false");
		expect(screen.getByRole("tablist")).toBeInTheDocument();
	});

	it("a request to inspect selects a tab and expands in the same render", () => {
		// The screen sets the tab and bumps expandOn together (contenthub ADR 0032).
		const rail = renderRail({ value: "branch", expandOn: undefined });
		rail.update({ value: "field", expandOn: 1 });
		expect(collapsedAttr()).toBe("false");
		expect(screen.getByRole("tab", { name: "Field" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByTestId("field-body")).toBeInTheDocument();
	});
});

function StatefulKeyed({
	onValueChange,
}: {
	onValueChange: (value: string) => void;
}) {
	const [value, setValue] = useState("branch");
	return (
		<ContextRail storageKey={KEY}>
			<ContextRail.Tabs
				value={value}
				onValueChange={(next) => {
					onValueChange(next);
					setValue(next);
				}}
			>
				<ContextRail.Tab value="branch" label="Branch" icon={<span>B</span>}>
					<div data-testid="branch-body">blockers</div>
				</ContextRail.Tab>
				<ContextRail.Tab value="field" label="Field" icon={<span>F</span>}>
					<div data-testid="field-body">inspector</div>
				</ContextRail.Tab>
			</ContextRail.Tabs>
		</ContextRail>
	);
}
