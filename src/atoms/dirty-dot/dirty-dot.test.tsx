import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DirtyDot } from "./dirty-dot";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("DirtyDot", () => {
	it("renders the dot when active (default)", () => {
		const { container } = renderWithChakra(<DirtyDot />);
		const span = container.querySelector("span[aria-label]");
		expect(span).not.toBeNull();
		expect(span?.getAttribute("aria-label")).toBe("ungespeicherte Änderungen");
	});

	it("renders nothing when active is false", () => {
		const { container } = renderWithChakra(<DirtyDot active={false} />);
		expect(container.firstChild).toBeNull();
	});
});
