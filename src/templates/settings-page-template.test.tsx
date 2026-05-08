// src/templates/settings-page-template.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";
import { SettingsPageTemplate } from "./settings-page-template";

function renderWithChakra(ui: ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("SettingsPageTemplate", () => {
	it("renders the active tab's content via bodyTabs (uncontrolled)", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<SettingsPageTemplate
					title="X"
					bodyTabs={{
						defaultValue: "a",
						items: [
							{
								value: "a",
								label: "Tab A",
								content: <div data-testid="content-a">A</div>,
							},
							{
								value: "b",
								label: "Tab B",
								content: <div data-testid="content-b">B</div>,
							},
						],
					}}
				/>
			</AppShell>,
		);
		expect(screen.getByTestId("content-a")).toBeInTheDocument();
		expect(screen.queryByTestId("content-b")).not.toBeInTheDocument();
	});

	it("throws when both bodyTabs and tabs are passed", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() =>
			renderWithChakra(
				<AppShell sidebar={<div />}>
					<SettingsPageTemplate
						title="X"
						tabs={<div />}
						bodyTabs={{
							defaultValue: "a",
							items: [{ value: "a", label: "A", content: <div /> }],
						}}
					/>
				</AppShell>,
			),
		).toThrow(/mutually exclusive/i);
		spy.mockRestore();
	});
});
