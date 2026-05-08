// src/templates/detail-page-template.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
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

	it("renders the tabs slot when provided", () => {
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
		expect(screen.getByTestId("tabs")).toBeInTheDocument();
	});

	it("renders the active tab's content via bodyTabs (uncontrolled)", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate
					title="X"
					bodyTabs={{
						defaultValue: "a",
						items: [
							{ value: "a", label: "Tab A", content: <div data-testid="content-a">A</div> },
							{ value: "b", label: "Tab B", content: <div data-testid="content-b">B</div> },
						],
					}}
				/>
			</AppShell>,
		);
		expect(screen.getByTestId("content-a")).toBeInTheDocument();
		expect(screen.queryByTestId("content-b")).not.toBeInTheDocument();
	});

	it("renders the subheader between header and tabs", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<DetailPageTemplate
					title="X"
					subheader={<div data-testid="subheader">subheader</div>}
				>
					<div data-testid="body">body</div>
				</DetailPageTemplate>
			</AppShell>,
		);
		const sub = screen.getByTestId("subheader");
		const body = screen.getByTestId("body");
		expect(sub).toBeInTheDocument();
		expect(sub.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("throws when both bodyTabs and tabs are passed", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() =>
			renderWithChakra(
				<AppShell sidebar={<div />}>
					<DetailPageTemplate
						title="X"
						tabs={<div />}
						bodyTabs={{ defaultValue: "a", items: [{ value: "a", label: "A", content: <div /> }] }}
					/>
				</AppShell>,
			),
		).toThrow(/mutually exclusive/i);
		spy.mockRestore();
	});
});
