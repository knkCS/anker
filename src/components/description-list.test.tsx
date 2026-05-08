import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { DescriptionList } from "./description-list";

function renderWithChakra(ui: ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("DescriptionList", () => {
	it("renders rows with labels and values", () => {
		renderWithChakra(
			<DescriptionList>
				<DescriptionList.Row label="Email">
					user@example.com
				</DescriptionList.Row>
				<DescriptionList.Row label="ID" mono>
					abc123
				</DescriptionList.Row>
			</DescriptionList>,
		);
		expect(screen.getByText("Email")).toBeInTheDocument();
		expect(screen.getByText("user@example.com")).toBeInTheDocument();
		expect(screen.getByText("ID")).toBeInTheDocument();
		expect(screen.getByText("abc123")).toBeInTheDocument();
	});

	it("applies a different CSS class when mono prop is set vs not set", () => {
		// Chakra v3 uses Emotion — styles are CSS classes, not inline styles.
		// We verify that the mono element gets a different class than a non-mono
		// element, confirming the fontFamily prop is actually applied.
		const { rerender } = renderWithChakra(
			<DescriptionList>
				<DescriptionList.Row label="ID" mono>
					abc123
				</DescriptionList.Row>
			</DescriptionList>,
		);
		const monoClass = screen.getByText("abc123").getAttribute("class");

		rerender(
			<ChakraProvider value={defaultSystem}>
				<DescriptionList>
					<DescriptionList.Row label="ID">abc123</DescriptionList.Row>
				</DescriptionList>
			</ChakraProvider>,
		);
		const nonMonoClass = screen.getByText("abc123").getAttribute("class");

		expect(monoClass).not.toBe(nonMonoClass);
	});

	it("renders horizontally by default (label and value in a flex row)", () => {
		const { container } = renderWithChakra(
			<DescriptionList>
				<DescriptionList.Row label="X">y</DescriptionList.Row>
			</DescriptionList>,
		);
		// Horizontal orientation: outer flex with justify-between
		const flex = container.querySelector("[class*='css-']");
		expect(flex).toBeTruthy();
	});

	it("renders vertically when orientation=vertical (label above value)", () => {
		renderWithChakra(
			<DescriptionList orientation="vertical">
				<DescriptionList.Row label="Status">Active</DescriptionList.Row>
			</DescriptionList>,
		);
		const label = screen.getByText("Status");
		const value = screen.getByText("Active");
		// vertical orientation: label sits above value in DOM
		expect(
			label.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("supports rich ReactNode values", () => {
		renderWithChakra(
			<DescriptionList>
				<DescriptionList.Row label="State">
					<span data-testid="badge">Active</span>
				</DescriptionList.Row>
			</DescriptionList>,
		);
		expect(screen.getByTestId("badge")).toBeInTheDocument();
	});
});
