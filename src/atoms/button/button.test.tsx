import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("Button", () => {
	it("renders without explicit colorPalette", () => {
		// Chakra v3 does not expose colorPalette in outerHTML — visual confirmation
		// is required post-release. This test confirms the button renders and
		// does not throw when no colorPalette is provided.
		renderWithChakra(<Button>Click</Button>);
		expect(screen.getByRole("button", { name: /click/i })).toBeInTheDocument();
	});

	it("renders with explicit colorPalette override", () => {
		renderWithChakra(<Button colorPalette="red">Delete</Button>);
		expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
	});
});
