// src/components/page-header.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("PageHeader", () => {
	it("renders the title", () => {
		renderWithChakra(<PageHeader title="Users" />);
		expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
	});

	it("renders subtitle when provided", () => {
		renderWithChakra(
			<PageHeader title="Users" subtitle="Manage workspace members" />,
		);
		expect(screen.getByText("Manage workspace members")).toBeInTheDocument();
	});

	it("does not render subtitle when not provided", () => {
		renderWithChakra(<PageHeader title="Users" />);
		expect(
			screen.queryByTestId("page-header-subtitle"),
		).not.toBeInTheDocument();
	});

	it("renders breadcrumbs as plain text when no `to`", () => {
		renderWithChakra(
			<PageHeader
				breadcrumbs={[{ label: "Identity" }, { label: "Users" }]}
				title="Users"
			/>,
		);
		expect(screen.getByText("Identity")).toBeInTheDocument();
		expect(screen.getAllByText("Users").length).toBeGreaterThanOrEqual(1);
	});

	it("renders breadcrumb with `to` as a link", () => {
		renderWithChakra(
			<PageHeader
				breadcrumbs={[
					{ label: "Identity", to: "/identity" },
					{ label: "Users" },
				]}
				title="Users"
			/>,
		);
		expect(screen.getByRole("link", { name: "Identity" })).toHaveAttribute(
			"href",
			"/identity",
		);
	});

	it("renders actions slot", () => {
		renderWithChakra(
			<PageHeader
				title="Users"
				actions={<button type="button">Invite</button>}
			/>,
		);
		expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
	});

	it("renders eyebrow when provided", () => {
		renderWithChakra(<PageHeader eyebrow="BETA" title="Users" />);
		expect(screen.getByText("BETA")).toBeInTheDocument();
	});

	it("does not render breadcrumbs container when breadcrumbs not provided", () => {
		renderWithChakra(<PageHeader title="Users" />);
		expect(
			screen.queryByTestId("page-header-breadcrumbs"),
		).not.toBeInTheDocument();
	});

	it("renders avatar to the left of the title when provided", () => {
		renderWithChakra(
			<PageHeader
				title="Jana Schmid"
				avatar={<div data-testid="avatar">JS</div>}
			/>,
		);
		const avatar = screen.getByTestId("avatar");
		const title = screen.getByRole("heading", { name: "Jana Schmid" });
		expect(avatar).toBeInTheDocument();
		expect(
			avatar.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("renders badges inline with the title", () => {
		renderWithChakra(
			<PageHeader
				title="Jana Schmid"
				badges={
					<>
						<span data-testid="b1">Aktiv</span>
						<span data-testid="b2">Admin</span>
					</>
				}
			/>,
		);
		expect(screen.getByTestId("b1")).toBeInTheDocument();
		expect(screen.getByTestId("b2")).toBeInTheDocument();
	});

	it("renders the meta line below the title", () => {
		renderWithChakra(
			<PageHeader
				title="Jana Schmid"
				meta={<span data-testid="meta">jana@example.test</span>}
			/>,
		);
		const meta = screen.getByTestId("meta");
		const title = screen.getByRole("heading", { name: "Jana Schmid" });
		expect(meta).toBeInTheDocument();
		expect(
			title.compareDocumentPosition(meta) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("does not render avatar/badges/meta containers when those props are absent", () => {
		renderWithChakra(<PageHeader title="Plain" />);
		expect(screen.queryByTestId("page-header-avatar")).not.toBeInTheDocument();
		expect(screen.queryByTestId("page-header-badges")).not.toBeInTheDocument();
		expect(screen.queryByTestId("page-header-meta")).not.toBeInTheDocument();
	});

	it("renders a tabs row at the bottom of the band when tabs is provided", () => {
		renderWithChakra(
			<PageHeader
				title="Users"
				tabs={
					<div data-testid="tabs-strip">
						<button type="button">All</button>
						<button type="button">Active</button>
					</div>
				}
			/>,
		);
		const tabsRow = screen.getByTestId("page-header-tabs");
		const tabsStrip = screen.getByTestId("tabs-strip");
		const title = screen.getByRole("heading", { name: "Users" });
		expect(tabsRow).toContainElement(tabsStrip);
		expect(
			title.compareDocumentPosition(tabsRow) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("does not render a tabs row when tabs prop is absent", () => {
		renderWithChakra(<PageHeader title="Users" />);
		expect(screen.queryByTestId("page-header-tabs")).not.toBeInTheDocument();
	});
});
