// src/templates/detail-page-template.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./app-shell";
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
