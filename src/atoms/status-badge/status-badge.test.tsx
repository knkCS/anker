import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STATUS_BADGE_TONES, StatusBadge } from ".";

// The colour each prop combination paints is pinned in a real browser:
// status-badge.browser.test.tsx.
function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("StatusBadge", () => {
	it("offers the four status palettes plus neutral and accent as tones", () => {
		expect([...STATUS_BADGE_TONES]).toEqual([
			"success",
			"warning",
			"danger",
			"info",
			"neutral",
			"accent",
		]);
	});

	it("renders the label with a tone, a color, both, or neither", () => {
		renderWithChakra(
			<>
				<StatusBadge label="Tone" tone="success" />
				<StatusBadge label="Color" color="#7c3aed" />
				<StatusBadge label="Both" tone="danger" color="#7c3aed" />
				<StatusBadge label="Neither" />
			</>,
		);
		for (const label of ["Tone", "Color", "Both", "Neither"]) {
			expect(screen.getByText(label)).toBeInTheDocument();
		}
	});

	it("renders the icon before the label with a tone", () => {
		renderWithChakra(
			<StatusBadge
				label="Live"
				tone="info"
				icon={<svg data-testid="icon" aria-hidden="true" />}
			/>,
		);
		expect(screen.getByText("Live").firstChild).toBe(
			screen.getByTestId("icon"),
		);
	});
});
