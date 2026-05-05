import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCellValue } from "./cell-utils";
import { StatusBadgeCell } from "./status-badge-cell";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("StatusBadgeCell", () => {
	it("renders the value as the badge label", () => {
		renderWithChakra(<StatusBadgeCell value="published" />);
		expect(screen.getByText("published")).toBeInTheDocument();
	});

	it("renders the empty cell value when value is null", () => {
		renderWithChakra(<StatusBadgeCell value={null} />);
		expect(screen.getByText(emptyCellValue)).toBeInTheDocument();
	});

	it("renders the detail line below the badge when detail is set", () => {
		renderWithChakra(
			<StatusBadgeCell value="failed" detail="Export timed out" />,
		);
		expect(screen.getByText("Export timed out")).toBeInTheDocument();
	});

	it("renders without crashing when tooltip is provided", () => {
		// Tooltip content only mounts on hover/focus; verify the badge still
		// renders and the component does not throw when wired up.
		renderWithChakra(
			<StatusBadgeCell
				value="metadata"
				tooltip="Click row to inspect payload"
			/>,
		);
		expect(screen.getByText("metadata")).toBeInTheDocument();
	});

	it("combines detail + tooltip without crashing", () => {
		renderWithChakra(
			<StatusBadgeCell
				value="failed"
				detail="Export timed out"
				tooltip="Retried 3 times"
			/>,
		);
		expect(screen.getByText("failed")).toBeInTheDocument();
		expect(screen.getByText("Export timed out")).toBeInTheDocument();
	});
});
