// src/templates/app-shell.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { createAnkerTheme } from "../theme/create-theme";
import { AppShell, usePageRail } from "./app-shell";

function renderWithChakra(ui: ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

// Use the anker theme so semantic tokens (`bg-surface`, `border`, …) actually
// resolve to `var(--chakra-colors-…)` references in computed styles. The
// surrounding tests use `defaultSystem` because they only need layout / DOM
// presence assertions; the column-surface tests below check token resolution.
function renderWithAnkerTheme(ui: ReactElement) {
	const system = createAnkerTheme();
	return render(<ChakraProvider value={system}>{ui}</ChakraProvider>);
}

function RailRegistrar() {
	usePageRail(<div data-testid="rail-content">registered rail</div>);
	return <div data-testid="page-body">body</div>;
}

describe("AppShell", () => {
	it("renders the sidebar", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb">sidebar</div>}>
				<div>main</div>
			</AppShell>,
		);
		expect(screen.getByTestId("sb")).toBeInTheDocument();
	});

	it("drops the rail column when no rail prop is supplied and no descendant registers content", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<div>main</div>
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell")).toHaveAttribute(
			"data-rail",
			"false",
		);
	});

	it("renders the rail prop when no descendant registers content", () => {
		renderWithChakra(
			<AppShell
				sidebar={<div data-testid="sb" />}
				rail={<div data-testid="prop-rail">from prop</div>}
			>
				<div>main</div>
			</AppShell>,
		);
		expect(screen.getByTestId("prop-rail")).toBeInTheDocument();
	});

	it("renders rail content registered by a descendant via usePageRail", () => {
		// Regression for #119: AppShell consumed its own slot store at the same
		// level it provided it, so the rail column never picked up content
		// registered by descendants. Splitting the consumer out of the provider
		// fixes this.
		renderWithChakra(
			<AppShell
				sidebar={<div data-testid="sb" />}
				rail={<div data-testid="prop-rail">from prop</div>}
			>
				<RailRegistrar />
			</AppShell>,
		);
		expect(screen.getByTestId("rail-content")).toBeInTheDocument();
		// Registered content wins over the prop fallback.
		expect(screen.queryByTestId("prop-rail")).not.toBeInTheDocument();
	});

	it("registered rail content shows even when no rail prop was passed", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<RailRegistrar />
			</AppShell>,
		);
		expect(screen.getByTestId("rail-content")).toBeInTheDocument();
		expect(screen.getByTestId("app-shell")).toHaveAttribute(
			"data-rail",
			"true",
		);
	});

	it("main column renders on the surface with a left divider", () => {
		// Visual contract: the main column sits on `bg-surface` (white) with a
		// 1px divider against the gray sidebar. Sidebar inherits the grid's
		// `bg-canvas`. See docs/page-patterns.md §2 "Column surfaces".
		renderWithAnkerTheme(
			<AppShell sidebar={<div data-testid="sb" />}>
				<div>main</div>
			</AppShell>,
		);
		const main = screen.getByTestId("app-shell-main");
		expect(main).toBeInTheDocument();
		expect(main).toHaveStyle({ borderLeftWidth: "1px" });
		const cs = window.getComputedStyle(main);
		expect(cs.background).toContain("--chakra-colors-bg-surface");
	});

	it("sidebar column is sticky to the viewport top", () => {
		// Regression: previously the sidebar scrolled away with the grid when
		// the main column overflowed the viewport. The sidebar must stay put.
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb">sidebar</div>}>
				<div>main</div>
			</AppShell>,
		);
		const sidebarCol = screen.getByTestId("app-shell-sidebar");
		expect(sidebarCol).toHaveStyle({ position: "sticky", top: "0" });
	});

	it("rail column is sticky to the viewport top", () => {
		renderWithChakra(
			<AppShell
				sidebar={<div data-testid="sb" />}
				rail={<div data-testid="rail">rail</div>}
			>
				<div>main</div>
			</AppShell>,
		);
		const railCol = screen.getByTestId("app-shell-rail");
		expect(railCol).toHaveStyle({ position: "sticky", top: "0" });
	});

	it("rail column renders on the surface with a left divider", () => {
		renderWithAnkerTheme(
			<AppShell
				sidebar={<div data-testid="sb" />}
				rail={<div data-testid="rail">rail</div>}
			>
				<div>main</div>
			</AppShell>,
		);
		const rail = screen.getByTestId("app-shell-rail");
		expect(rail).toBeInTheDocument();
		expect(rail).toHaveStyle({ borderLeftWidth: "1px" });
		const cs = window.getComputedStyle(rail);
		expect(cs.background).toContain("--chakra-colors-bg-surface");
	});
});
