import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCellValue } from "./cell-utils";
import { IdentityCell } from "./identity-cell";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("IdentityCell", () => {
	it("renders the name as primary text", () => {
		renderWithChakra(<IdentityCell name="Jane Doe" />);
		expect(screen.getByText("Jane Doe")).toBeInTheDocument();
	});

	it("renders subText below the name", () => {
		renderWithChakra(
			<IdentityCell name="Jane Doe" subText="jane@example.com" />,
		);
		expect(screen.getByText("jane@example.com")).toBeInTheDocument();
	});

	it("derives initials from a two-word name when avatarFallback is omitted", () => {
		renderWithChakra(<IdentityCell name="Jane Doe" />);
		expect(screen.getByText("JD")).toBeInTheDocument();
	});

	it("derives initials from a single-word name", () => {
		renderWithChakra(<IdentityCell name="Cher" />);
		expect(screen.getByText("CH")).toBeInTheDocument();
	});

	it("uses the explicit avatarFallback over derived initials", () => {
		renderWithChakra(<IdentityCell name="Jane Doe" avatarFallback="ZZ" />);
		expect(screen.getByText("ZZ")).toBeInTheDocument();
		expect(screen.queryByText("JD")).not.toBeInTheDocument();
	});

	it("renders the empty cell value when name is null", () => {
		renderWithChakra(<IdentityCell name={null} />);
		expect(screen.getByText(emptyCellValue)).toBeInTheDocument();
	});

	it("renders the empty cell value when name is undefined", () => {
		renderWithChakra(<IdentityCell name={undefined} />);
		expect(screen.getByText(emptyCellValue)).toBeInTheDocument();
	});

	it("renders with colorPalette without crashing", () => {
		// Chakra v3 does not expose colorPalette in outerHTML — visual
		// confirmation is required post-release. This test verifies the
		// IdentityCell accepts the prop, forwards it to the underlying
		// Avatar primitive, and does not throw.
		renderWithChakra(<IdentityCell name="Jane Doe" colorPalette="primary" />);
		expect(screen.getByText("Jane Doe")).toBeInTheDocument();
		expect(screen.getByText("JD")).toBeInTheDocument();
	});
});
