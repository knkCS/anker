// src/templates/app-shell.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { createAnkerTheme } from "../theme/create-theme";
import { AppShell, usePageHeader, usePageRail } from "./app-shell";

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

	it("main column shares bg-canvas with the sidebar and has a left divider", () => {
		// Visual contract: the main column sits on `bg-canvas` (gray) — same
		// as the sidebar — with a 1px divider against the sidebar. Cards
		// (bg-surface white) provide content surface contrast against the
		// canvas. See docs/page-patterns.md §2 "Column surfaces".
		renderWithAnkerTheme(
			<AppShell sidebar={<div data-testid="sb" />}>
				<div>main</div>
			</AppShell>,
		);
		const main = screen.getByTestId("app-shell-main");
		expect(main).toBeInTheDocument();
		expect(main).toHaveStyle({ borderLeftWidth: "1px" });
		const cs = window.getComputedStyle(main);
		expect(cs.background).toContain("--chakra-colors-bg-canvas");
	});

	it("the shell grid is a fixed 100vh viewport that does not scroll the document", () => {
		// Internal-scroll model: the grid is exactly the viewport height and
		// clips its own overflow, so the document never scrolls — the columns
		// scroll internally instead.
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb">sidebar</div>}>
				<div>main</div>
			</AppShell>,
		);
		const grid = screen.getByTestId("app-shell");
		expect(grid).toHaveStyle({ height: "100vh", overflow: "hidden" });
		expect(grid).not.toHaveStyle({ minHeight: "100vh" });
	});

	it("the main column scrolls internally", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<div>main</div>
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell-main")).toHaveStyle({
			overflowY: "auto",
		});
	});

	it("the rail column does not scroll itself and is no longer sticky", () => {
		// The rail column must NOT set overflowY: a scrolling box would force
		// overflow-x to clip and cut the ContextRail collapse toggle (positioned
		// `left: -3.5` to protrude into the main column) in half. The rail scrolls
		// via ContextRail's own inner Stack instead.
		renderWithChakra(
			<AppShell
				sidebar={<div data-testid="sb" />}
				rail={<div data-testid="rail">rail</div>}
			>
				<div>main</div>
			</AppShell>,
		);
		const railCol = screen.getByTestId("app-shell-rail");
		expect(railCol).not.toHaveStyle({ overflowY: "auto" });
		expect(railCol).not.toHaveStyle({ position: "sticky" });
	});

	it("the sidebar column fills the grid height and is no longer sticky", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<div>main</div>
			</AppShell>,
		);
		const sidebarCol = screen.getByTestId("app-shell-sidebar");
		expect(sidebarCol).not.toHaveStyle({ position: "sticky" });
		expect(sidebarCol).toHaveStyle({ zIndex: "11" });
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

	function HeaderRegistrar({
		label = "registered header",
	}: {
		label?: string;
	}) {
		usePageHeader(<div data-testid="header-content">{label}</div>);
		return <div data-testid="page-body">body</div>;
	}

	it("renders header content registered by a descendant via usePageHeader", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderRegistrar />
			</AppShell>,
		);
		expect(screen.getByTestId("header-content")).toBeInTheDocument();
	});

	it("renders no header row when no descendant registers a header", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<div data-testid="page-body">body</div>
			</AppShell>,
		);
		expect(screen.queryByTestId("app-shell-header")).not.toBeInTheDocument();
	});

	it("header spans main + rail columns when both header and rail are registered", () => {
		function HeaderAndRail() {
			usePageHeader(<div data-testid="header-content">hdr</div>);
			usePageRail(<div data-testid="rail-content">rail</div>);
			return <div>body</div>;
		}
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderAndRail />
			</AppShell>,
		);
		const headerCell = screen.getByTestId("app-shell-header");
		// With a rail present, the header cell spans columns 2-3 (gridColumn: "2 / 4").
		expect(window.getComputedStyle(headerCell).gridColumn).toBe("2/4");
	});

	it("header spans only the main column when no rail is registered", () => {
		function HeaderOnly() {
			usePageHeader(<div data-testid="header-content">hdr</div>);
			return <div>body</div>;
		}
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderOnly />
			</AppShell>,
		);
		const headerCell = screen.getByTestId("app-shell-header");
		expect(window.getComputedStyle(headerCell).gridColumn).toBe("2/3");
	});
});

function HeaderRegistrar({ sticky }: { sticky?: boolean }) {
	usePageHeader(
		<div data-testid="header-content">registered header</div>,
		sticky === undefined ? undefined : { sticky },
	);
	return <div data-testid="page-body">body</div>;
}

describe("AppShell — sticky page header", () => {
	it("marks the header row sticky by default when content is registered", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderRegistrar />
			</AppShell>,
		);
		const headerBox = screen.getByTestId("app-shell-header");
		expect(headerBox).toHaveAttribute("data-sticky-header", "true");
	});

	it("marks the header row non-sticky when the registration opts out", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderRegistrar sticky={false} />
			</AppShell>,
		);
		const headerBox = screen.getByTestId("app-shell-header");
		expect(headerBox).toHaveAttribute("data-sticky-header", "false");
	});

	it("keeps the single-arg usePageHeader form working (defaults to sticky)", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderRegistrar />
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell-header")).toHaveAttribute(
			"data-sticky-header",
			"true",
		);
	});

	it("stacks the sidebar above the sticky header so its protruding controls remain clickable", () => {
		// Regression: the Sidebar's collapse toggle protrudes via `right: -3.5`
		// into the next column. With the sticky header at z-index `docked` (10),
		// the sidebar Box must sit strictly above so its toggle isn't covered.
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderRegistrar />
			</AppShell>,
		);
		const sidebarBox = screen.getByTestId("app-shell-sidebar");
		expect(sidebarBox).toHaveStyle({ zIndex: "11" });
	});
});
