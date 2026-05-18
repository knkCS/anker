// src/templates/subnav-layout.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
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
						<button type="button">Add</button>
					</SubNavLayout.Toolbar>
					<div>rest</div>
				</SubNavLayout.Detail>
			</SubNavLayout>,
		);
		expect(screen.getByTestId("subnav-layout-toolbar")).toContainElement(
			screen.getByRole("button", { name: "Add" }),
		);
	});
});
