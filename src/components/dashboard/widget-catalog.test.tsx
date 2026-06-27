import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WidgetDefinition } from "./types";
import { WidgetCatalog } from "./widget-catalog";

const defs: WidgetDefinition[] = [
	{
		type: "a",
		name: "Alpha",
		category: "Metrics",
		description: "first",
		minSize: { w: 1, h: 1 },
		defaultSize: { w: 2, h: 2 },
		Component: () => null,
	},
	{
		type: "b",
		name: "Beta",
		category: "General",
		minSize: { w: 1, h: 1 },
		defaultSize: { w: 2, h: 2 },
		Component: () => null,
	},
];

function setup(onSelect = vi.fn(), onClose = vi.fn()) {
	render(
		<ChakraProvider value={defaultSystem}>
			<WidgetCatalog
				open
				onClose={onClose}
				definitions={defs}
				onSelect={onSelect}
			/>
		</ChakraProvider>,
	);
	return { onSelect, onClose };
}

describe("WidgetCatalog", () => {
	it("renders an entry per definition", () => {
		setup();
		expect(screen.getByLabelText("Alpha")).toBeInTheDocument();
		expect(screen.getByLabelText("Beta")).toBeInTheDocument();
	});

	it("calls onSelect and onClose when an entry is clicked", () => {
		const { onSelect, onClose } = setup();
		fireEvent.click(screen.getByLabelText("Alpha"));
		expect(onSelect).toHaveBeenCalledWith(defs[0]);
		expect(onClose).toHaveBeenCalled();
	});
});
