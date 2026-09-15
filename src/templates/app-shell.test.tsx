// src/templates/app-shell.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { createAnkerTheme } from "../theme/create-theme";
import {
	AppShell,
	usePageActions,
	usePageHeader,
	usePageRail,
} from "./app-shell";

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

// ---------------------------------------------------------------------------
// Host contract — AppShell provides it and renders its header from the frame
// the page templates report. See docs/adr/0003 and docs/page-patterns.md
// §2 "Host contract".
// ---------------------------------------------------------------------------

import { createRef, type ReactNode } from "react";
import { Button } from "../atoms/button";
import { PageHeader } from "../components/page-header";
import {
	type PageFrame,
	TestHost,
	type TestHostHandle,
	usePageFrame,
} from "../host";
import { DetailPageTemplate } from "./detail-page-template";
import { IndexPageTemplate } from "./index-page-template";
import { SettingsPageTemplate } from "./settings-page-template";

function FrameReporter({ frame }: { frame: PageFrame }) {
	usePageFrame(frame);
	return <div data-testid="page-body">body</div>;
}

describe("AppShell — host contract", () => {
	it("renders a PageHeader from the frame a descendant reports via usePageFrame", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<FrameReporter
					frame={{
						title: "Users",
						eyebrow: "Identity",
						breadcrumbs: [
							{ label: "Identity", to: "/identity" },
							{ label: "Users" },
						],
						actions: <button type="button">Invite</button>,
						tabs: <div data-testid="tabs">tabs</div>,
					}}
				/>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(
			within(header).getByRole("heading", { name: "Users" }),
		).toBeInTheDocument();
		expect(
			within(header).getByTestId("page-header-breadcrumbs"),
		).toHaveTextContent("Identity");
		expect(
			within(header).getByRole("button", { name: "Invite" }),
		).toBeInTheDocument();
		expect(within(header).getByTestId("tabs")).toBeInTheDocument();
		expect(header).toHaveAttribute("data-sticky-header", "true");
	});

	it("honours the frame's sticky hint", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<FrameReporter frame={{ title: "Users", sticky: false }} />
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell-header")).toHaveAttribute(
			"data-sticky-header",
			"false",
		);
	});

	it("drops the header row again when the reporting screen unmounts", () => {
		function Shell({ children }: { children: ReactNode }) {
			return <AppShell sidebar={<div data-testid="sb" />}>{children}</AppShell>;
		}
		const { rerender } = renderWithChakra(
			<Shell>
				<FrameReporter frame={{ title: "Users" }} />
			</Shell>,
		);
		expect(screen.getByTestId("app-shell-header")).toBeInTheDocument();
		rerender(
			<ChakraProvider value={defaultSystem}>
				<Shell>
					<div>no screen</div>
				</Shell>
			</ChakraProvider>,
		);
		expect(screen.queryByTestId("app-shell-header")).not.toBeInTheDocument();
	});

	it("an opaque usePageHeader registration is bespoke chrome and wins over a reported frame", () => {
		function Both() {
			usePageHeader(<div data-testid="bespoke">bespoke header</div>, {
				sticky: false,
			});
			usePageFrame({ title: "Reported" });
			return <div>body</div>;
		}
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<Both />
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(within(header).getByTestId("bespoke")).toBeInTheDocument();
		expect(
			within(header).queryByRole("heading", { name: "Reported" }),
		).not.toBeInTheDocument();
		expect(header).toHaveAttribute("data-sticky-header", "false");
	});

	it("does not leak a page's frame to a host above the shell", () => {
		// A host nesting an AppShell (core's bridge shell) keeps its own frame
		// untouched: AppShell is the consumer of everything reported beneath it.
		const host = createRef<TestHostHandle>();
		renderWithChakra(
			<TestHost ref={host}>
				<AppShell sidebar={<div data-testid="sb" />}>
					<FrameReporter frame={{ title: "Inside the shell" }} />
				</AppShell>
			</TestHost>,
		);
		expect(host.current?.frame).toBeNull();
		expect(
			screen.getByRole("heading", { name: "Inside the shell" }),
		).toBeInTheDocument();
	});

	it("does not leak a page's rail to a host above the shell", () => {
		// Same rule as the frame: the shell that draws the rail column is the
		// one that receives the rail.
		const host = createRef<TestHostHandle>();
		renderWithChakra(
			<TestHost ref={host}>
				<AppShell sidebar={<div data-testid="sb" />}>
					<RailRegistrar />
				</AppShell>
			</TestHost>,
		);
		expect(host.current?.rail).toBeNull();
		expect(
			within(screen.getByTestId("app-shell-rail")).getByTestId("rail-content"),
		).toBeInTheDocument();
	});

	it("a rail reported through the host contract clears the column on unmount", () => {
		const { rerender } = renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<RailRegistrar />
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell")).toHaveAttribute(
			"data-rail",
			"true",
		);
		rerender(
			<ChakraProvider value={defaultSystem}>
				<AppShell sidebar={<div data-testid="sb" />}>
					<div>no rail</div>
				</AppShell>
			</ChakraProvider>,
		);
		expect(screen.getByTestId("app-shell")).toHaveAttribute(
			"data-rail",
			"false",
		);
	});

	// The header AppShell renders IS the reported state: for each template,
	// capture what it reports under a TestHost, render `<PageHeader>` from that
	// frame by hand, and compare the markup byte-for-byte with the band AppShell
	// draws for the same template.
	const templates: Array<[string, ReactNode]> = [
		[
			"DetailPageTemplate",
			<DetailPageTemplate
				key="detail"
				breadcrumbs={[
					{ label: "Identity", to: "/identity" },
					{ label: "Jana Schmid" },
				]}
				title="Jana Schmid"
				subtitle="Product"
				eyebrow="User"
				avatar={<span data-testid="av">JS</span>}
				badges={<span>Active</span>}
				meta={<span>jana@example.test</span>}
				actions={<Button>Edit</Button>}
				tabs={<div>tab list</div>}
				stickyHeader={false}
			>
				<div>body</div>
			</DetailPageTemplate>,
		],
		[
			"IndexPageTemplate",
			<IndexPageTemplate
				key="index"
				breadcrumbs={[{ label: "Identity" }, { label: "Users" }]}
				title="Users"
				subtitle="Everyone with access"
				eyebrow="Identity"
				actions={<Button>Invite</Button>}
				tabs={<div>tab list</div>}
				toolbar={<div>toolbar</div>}
			>
				<div>body</div>
			</IndexPageTemplate>,
		],
		[
			"SettingsPageTemplate",
			<SettingsPageTemplate
				key="settings"
				breadcrumbs={[{ label: "Settings" }]}
				title="Workspace"
				eyebrow="Settings"
				avatar={<span>WS</span>}
				badges={<span>Pro</span>}
				meta={<span>ws-1</span>}
				actions={<Button>Save</Button>}
				tabs={<div>tab list</div>}
			>
				<div>body</div>
			</SettingsPageTemplate>,
		],
	];

	it.each(
		templates,
	)("%s: the header AppShell renders equals the frame the template reports", (_name, template) => {
		const host = createRef<TestHostHandle>();
		const captured = renderWithChakra(
			<TestHost ref={host}>{template}</TestHost>,
		);
		const frame = host.current?.frame;
		expect(frame).not.toBeNull();
		captured.unmount();

		const { sticky: _sticky, ...headerProps } = frame as PageFrame;
		const expected = renderWithChakra(
			<div data-testid="expected">
				<PageHeader {...headerProps} />
			</div>,
		);
		const expectedHtml = screen.getByTestId("expected").innerHTML;
		expected.unmount();

		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>{template}</AppShell>,
		);
		expect(screen.getByTestId("app-shell-header").innerHTML).toBe(expectedHtml);
	});

	it("a template's frame carries its stickyHeader prop", () => {
		const host = createRef<TestHostHandle>();
		renderWithChakra(
			<TestHost ref={host}>
				<DetailPageTemplate title="Pinned off" stickyHeader={false}>
					<div>body</div>
				</DetailPageTemplate>
			</TestHost>,
		);
		expect(host.current?.frame?.sticky).toBe(false);
	});

	it("a template reports the actions registered via usePageActions when none are given", () => {
		function Registrar() {
			usePageActions(<button type="button">Registered</button>);
			return <div>pane</div>;
		}
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<IndexPageTemplate title="Users">
					<Registrar />
				</IndexPageTemplate>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(
			within(header).getByRole("button", { name: "Registered" }),
		).toBeInTheDocument();
	});
});
