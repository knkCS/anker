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
});
