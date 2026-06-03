// src/components/nav-list/nav-list.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
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

	it("Group renders item flex container with data-testid nav-list-group-items", () => {
		const { container } = renderWithChakra(
			<NavList aria-label="t">
				<NavList.Group label="Group">
					<NavList.Item>
						<span>One</span>
					</NavList.Item>
					<NavList.Item>
						<span>Two</span>
					</NavList.Item>
				</NavList.Group>
			</NavList>,
		);
		expect(
			container.querySelector('[data-testid="nav-list-group-items"]'),
		).toBeInTheDocument();
	});
});
