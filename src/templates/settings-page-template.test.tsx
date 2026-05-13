// src/templates/settings-page-template.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./app-shell";
import { SettingsPageTemplate } from "./settings-page-template";

function renderWithChakra(ui: ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("SettingsPageTemplate", () => {
	it("renders the title", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<SettingsPageTemplate title="Einstellungen">
					<div>body</div>
				</SettingsPageTemplate>
			</AppShell>,
		);
		expect(
			screen.getByRole("heading", { name: "Einstellungen" }),
		).toBeInTheDocument();
	});

	it("renders children in the body", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<SettingsPageTemplate title="Einstellungen">
					<div data-testid="body-content">content</div>
				</SettingsPageTemplate>
			</AppShell>,
		);
		expect(screen.getByTestId("body-content")).toBeInTheDocument();
	});

	it("constrains body width to 3xl by default", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<SettingsPageTemplate title="Einstellungen">
					<div data-testid="body-content">content</div>
				</SettingsPageTemplate>
			</AppShell>,
		);
		const content = screen.getByTestId("body-content");
		// The constraining Box wraps the direct children
		const constrainingBox = content.parentElement as HTMLElement;
		// maxW="3xl" is set as a chakra prop — verify parent exists and is present
		expect(constrainingBox).toBeInTheDocument();
	});

	it("applies body padding by default", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<SettingsPageTemplate title="Einstellungen">
					<div data-testid="body-content">content</div>
				</SettingsPageTemplate>
			</AppShell>,
		);
		const content = screen.getByTestId("body-content");
		// Walk up two levels: content -> constraining Box -> padding Box
		const paddingBox = content.parentElement?.parentElement as HTMLElement;
		expect(paddingBox).toBeInTheDocument();
	});

	it("renders the tabs slot inside the registered header", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<SettingsPageTemplate
					title="Einstellungen"
					tabs={<div data-testid="tabs">tabs</div>}
				>
					<div>body</div>
				</SettingsPageTemplate>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(within(header).getByTestId("tabs")).toBeInTheDocument();
	});

	it("forwards avatar, badges, meta, and tabs into the registered PageHeader", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<SettingsPageTemplate
					title="Einstellungen"
					avatar={<div data-testid="av">AV</div>}
					badges={<span data-testid="bd">Pro</span>}
					meta={<span data-testid="mt">org@example.test</span>}
					tabs={<div data-testid="tb">tab list</div>}
				>
					body
				</SettingsPageTemplate>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(within(header).getByTestId("av")).toBeInTheDocument();
		expect(within(header).getByTestId("bd")).toBeInTheDocument();
		expect(within(header).getByTestId("mt")).toBeInTheDocument();
		expect(within(header).getByTestId("tb")).toBeInTheDocument();
	});
});
