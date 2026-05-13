import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./app-shell";
import { IndexPageTemplate } from "./index-page-template";

function renderWithChakra(ui: ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("IndexPageTemplate", () => {
	it("forwards the tabs prop into the registered PageHeader", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<IndexPageTemplate
					title="Users"
					tabs={<div data-testid="t-all">All</div>}
				>
					body
				</IndexPageTemplate>
			</AppShell>,
		);
		const header = screen.getByTestId("app-shell-header");
		expect(within(header).getByTestId("t-all")).toBeInTheDocument();
	});

	it("does not render tabs as a body sibling", () => {
		renderWithChakra(
			<AppShell sidebar={<div />}>
				<IndexPageTemplate
					title="Users"
					tabs={<div data-testid="t-all">All</div>}
				>
					body
				</IndexPageTemplate>
			</AppShell>,
		);
		const template = screen.getByTestId("index-page-template");
		// tabs are now inside the app-shell-header, NOT a child of the template body.
		expect(within(template).queryByTestId("t-all")).not.toBeInTheDocument();
	});
});
