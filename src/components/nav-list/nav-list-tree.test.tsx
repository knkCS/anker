// src/components/nav-list/nav-list-tree.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SubNavLayout } from "../../templates/subnav-layout";
import { NavList } from "./nav-list";
import { NavListModeProvider } from "./nav-list-context";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

/** A table → row → cell tree, each label an asChild button that selects. */
function Tree({
	initialOpen = [],
	onSelect = () => {},
	indicator,
}: {
	initialOpen?: string[];
	onSelect?: (name: string) => void;
	indicator?: React.ReactNode;
}) {
	const [open, setOpen] = useState(() => new Set(initialOpen));
	const toggle = (name: string) => (next: boolean) =>
		setOpen((prev) => {
			const copy = new Set(prev);
			if (next) copy.add(name);
			else copy.delete(name);
			return copy;
		});
	return (
		<NavList aria-label="Nodes">
			<NavList.Group label="Blocks">
				<NavList.Item asChild>
					<button type="button" onClick={() => onSelect("paragraph")}>
						Paragraph
					</button>
				</NavList.Item>
				<NavList.Item
					asChild
					expanded={open.has("table")}
					onExpandedChange={toggle("table")}
					indicator={indicator}
					subItems={
						<NavList.Item
							asChild
							expanded={open.has("row")}
							onExpandedChange={toggle("row")}
							subItems={
								<NavList.Item asChild>
									<button type="button" onClick={() => onSelect("cell")}>
										Cell
									</button>
								</NavList.Item>
							}
						>
							<button type="button" onClick={() => onSelect("row")}>
								Row
							</button>
						</NavList.Item>
					}
				>
					<button type="button" onClick={() => onSelect("table")}>
						Table
					</button>
				</NavList.Item>
			</NavList.Group>
		</NavList>
	);
}

const toggleFor = (name: string) =>
	screen.getByRole("button", { name: `Toggle ${name}` });

describe("NavList.Item tree", () => {
	it("hides child items while collapsed and shows them indented when expanded", () => {
		renderWithChakra(<Tree initialOpen={["table"]} />);
		const table = screen.getByRole("button", { name: "Table" });
		const row = screen.getByRole("button", { name: "Row" });
		expect(screen.queryByRole("button", { name: "Cell" })).toBeNull();
		const padStart = (el: HTMLElement) =>
			el.getAttribute("style")?.match(/padding-inline-start: ([^;]+)/)?.[1];
		expect(padStart(row)).not.toEqual(padStart(table));
		expect(padStart(row)).toContain("1 * var(--chakra-spacing-5)");
		expect(padStart(table)).toContain("0 * var(--chakra-spacing-5)");
	});

	it("nests more than one level", () => {
		renderWithChakra(<Tree initialOpen={["table", "row"]} />);
		const cell = screen.getByRole("button", { name: "Cell" });
		expect(cell.getAttribute("style")).toContain("2 * var(--chakra-spacing-5)");
		// The child list is a group named by its parent.
		expect(screen.getByRole("group", { name: "Row" })).toContainElement(cell);
		expect(screen.getByRole("group", { name: "Table" })).toContainElement(cell);
	});

	it("the chevron only toggles; the label keeps its own action", () => {
		const onSelect = vi.fn();
		renderWithChakra(<Tree onSelect={onSelect} />);
		fireEvent.click(toggleFor("Table"));
		expect(screen.getByRole("button", { name: "Row" })).toBeInTheDocument();
		expect(onSelect).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "Table" }));
		expect(onSelect).toHaveBeenCalledWith("table");
		// Selecting did not collapse it.
		expect(screen.getByRole("button", { name: "Row" })).toBeInTheDocument();
	});

	it("is controlled: onExpandedChange reports, expanded decides", () => {
		const onExpandedChange = vi.fn();
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item
						expanded={false}
						onExpandedChange={onExpandedChange}
						subItems={<NavList.Item>Child</NavList.Item>}
					>
						Parent
					</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		fireEvent.click(toggleFor("Parent"));
		expect(onExpandedChange).toHaveBeenCalledWith(true);
		expect(screen.queryByText("Child")).toBeNull();
	});

	it("is uncontrolled with defaultExpanded when expanded is omitted", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item
						defaultExpanded
						subItems={<NavList.Item>Child</NavList.Item>}
					>
						Parent
					</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(screen.getByText("Child")).toBeInTheDocument();
		fireEvent.click(toggleFor("Parent"));
		expect(screen.queryByText("Child")).toBeNull();
	});

	it("puts aria-expanded and aria-controls on the parent's toggle", () => {
		renderWithChakra(<Tree />);
		const toggle = toggleFor("Table");
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		const group = screen.getByRole("group", { name: "Table" });
		expect(toggle).toHaveAttribute("aria-controls", group.id);
		// Leaves carry no expanded state.
		expect(
			screen.getByRole("button", { name: "Paragraph" }),
		).not.toHaveAttribute("aria-expanded");
	});

	it("names the toggle with toggleAriaLabel when given", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item
						toggleAriaLabel="Show table parts"
						subItems={<NavList.Item>Row</NavList.Item>}
					>
						Table
					</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(
			screen.getByRole("button", { name: "Show table parts" }),
		).toBeInTheDocument();
	});

	it("Arrow Right opens and Arrow Left closes a focused parent", () => {
		renderWithChakra(<Tree />);
		const table = screen.getByRole("button", { name: "Table" });
		table.focus();
		fireEvent.keyDown(table, { key: "ArrowRight" });
		expect(toggleFor("Table")).toHaveAttribute("aria-expanded", "true");
		fireEvent.keyDown(table, { key: "ArrowLeft" });
		expect(toggleFor("Table")).toHaveAttribute("aria-expanded", "false");
		// From the toggle itself too.
		fireEvent.keyDown(toggleFor("Table"), { key: "ArrowRight" });
		expect(toggleFor("Table")).toHaveAttribute("aria-expanded", "true");
	});

	it("Arrow Right on an open parent moves focus to its first child", () => {
		renderWithChakra(<Tree initialOpen={["table"]} />);
		const table = screen.getByRole("button", { name: "Table" });
		table.focus();
		fireEvent.keyDown(table, { key: "ArrowRight" });
		expect(screen.getByRole("button", { name: "Row" })).toHaveFocus();
	});

	it("Arrow Left on a child moves focus to its parent", () => {
		renderWithChakra(<Tree initialOpen={["table", "row"]} />);
		const cell = screen.getByRole("button", { name: "Cell" });
		cell.focus();
		fireEvent.keyDown(cell, { key: "ArrowLeft" });
		expect(screen.getByRole("button", { name: "Row" })).toHaveFocus();
		// A closed child parent: Arrow Left goes on up rather than staying.
		fireEvent.keyDown(screen.getByRole("button", { name: "Row" }), {
			key: "ArrowLeft",
		});
		// Row was open, so the first Arrow Left closes it…
		expect(toggleFor("Row")).toHaveAttribute("aria-expanded", "false");
		fireEvent.keyDown(screen.getByRole("button", { name: "Row" }), {
			key: "ArrowLeft",
		});
		// …and the second moves to Table, which stays open.
		expect(screen.getByRole("button", { name: "Table" })).toHaveFocus();
		expect(toggleFor("Table")).toHaveAttribute("aria-expanded", "true");
	});

	it("focuses the parent's toggle when its label is not focusable", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item
						defaultExpanded
						subItems={
							<NavList.Item asChild>
								<a href="#child">Child</a>
							</NavList.Item>
						}
					>
						Parent
					</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		const child = screen.getByRole("link", { name: "Child" });
		child.focus();
		fireEvent.keyDown(child, { key: "ArrowLeft" });
		expect(toggleFor("Parent")).toHaveFocus();
	});

	it("keeps the roll-up indicator visible on a collapsed parent", () => {
		renderWithChakra(
			<Tree indicator={<span data-testid="rollup">dot</span>} />,
		);
		expect(toggleFor("Table")).toHaveAttribute("aria-expanded", "false");
		expect(screen.getByTestId("rollup")).toBeVisible();
		expect(screen.getByTestId("nav-list-indicator")).toContainElement(
			screen.getByTestId("rollup"),
		);
	});

	it("aligns leaf labels with parent labels at the same level", () => {
		renderWithChakra(<Tree />);
		const paragraph = screen.getByRole("button", { name: "Paragraph" });
		const table = screen.getByRole("button", { name: "Table" });
		const padStart = (el: HTMLElement) =>
			el.getAttribute("style")?.match(/padding-inline-start: ([^;]+)/)?.[1];
		expect(padStart(paragraph)).toEqual(padStart(table));
	});

	it("leaves a flat list's markup alone", () => {
		renderWithChakra(
			<NavList aria-label="x">
				<NavList.Group>
					<NavList.Item>Fonts</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		const row = screen.getByTestId("nav-list-item");
		expect(row.getAttribute("style")).not.toContain("padding-inline-start");
		expect(screen.queryByRole("group")).toBeNull();
		expect(screen.queryByTestId("nav-list-indicator")).toBeNull();
	});

	describe("on the collapsed rail", () => {
		it("drops the chevron and indentation, still lists open children, and keeps the indicator", () => {
			renderWithChakra(
				<NavListModeProvider value={{ collapsed: true }}>
					<NavList aria-label="x">
						<NavList.Group>
							<NavList.Item
								icon={<svg data-testid="icon-table" />}
								label="Table"
								defaultExpanded
								indicator={<span data-testid="rollup" />}
								subItems={
									<NavList.Item
										icon={<svg data-testid="icon-row" />}
										label="Row"
									>
										Row
									</NavList.Item>
								}
							>
								Table
							</NavList.Item>
						</NavList.Group>
					</NavList>
				</NavListModeProvider>,
			);
			expect(screen.queryByRole("button", { name: "Toggle Table" })).toBeNull();
			expect(screen.getByTestId("icon-row")).toBeInTheDocument();
			expect(screen.getByTestId("rollup")).toBeInTheDocument();
			for (const row of screen.getAllByTestId("nav-list-item")) {
				expect(row.getAttribute("style")).not.toContain("padding-inline-start");
			}
		});

		it("works inside SubNavLayout, collapsing and expanding the rail", () => {
			window.localStorage.clear();
			renderWithChakra(
				<SubNavLayout>
					<SubNavLayout.Nav aria-label="Nodes">
						<NavList.Group>
							<NavList.Item
								icon={<svg />}
								label="Table"
								defaultExpanded
								subItems={
									<NavList.Item icon={<svg />} label="Row">
										Row
									</NavList.Item>
								}
							>
								Table
							</NavList.Item>
						</NavList.Group>
					</SubNavLayout.Nav>
					<SubNavLayout.Detail>detail</SubNavLayout.Detail>
				</SubNavLayout>,
			);
			expect(toggleFor("Table")).toBeInTheDocument();
			expect(screen.getByText("Row")).toBeInTheDocument();
			fireEvent.click(screen.getByRole("button", { name: "Collapse sub-nav" }));
			expect(screen.queryByRole("button", { name: "Toggle Table" })).toBeNull();
			expect(screen.queryByText("Row")).toBeNull(); // label hidden on the rail
			expect(screen.getAllByTestId("nav-list-item")).toHaveLength(2);
			fireEvent.click(screen.getByRole("button", { name: "Expand sub-nav" }));
			expect(toggleFor("Table")).toHaveAttribute("aria-expanded", "true");
		});
	});
});
