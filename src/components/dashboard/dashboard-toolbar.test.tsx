import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { DashboardToolbar } from "./dashboard-toolbar";
import { defaultDashboardLabels } from "./labels";

function setup(
	props: Partial<React.ComponentProps<typeof DashboardToolbar>> = {},
) {
	const handlers = {
		onEdit: vi.fn(),
		onAddWidget: vi.fn(),
		onSave: vi.fn(),
		onDiscard: vi.fn(),
	};
	render(
		<ChakraProvider value={defaultSystem}>
			<DashboardToolbar
				mode="view"
				isDirty={false}
				labels={defaultDashboardLabels}
				{...handlers}
				{...props}
			/>
		</ChakraProvider>,
	);
	return handlers;
}

describe("DashboardToolbar", () => {
	it("shows Edit in view mode and triggers onEdit", () => {
		const h = setup();
		fireEvent.click(screen.getByText(defaultDashboardLabels.edit));
		expect(h.onEdit).toHaveBeenCalled();
	});

	it("shows Add/Discard/Save in edit mode", () => {
		setup({ mode: "edit" });
		expect(
			screen.getByText(defaultDashboardLabels.addWidget),
		).toBeInTheDocument();
		expect(
			screen.getByText(defaultDashboardLabels.discard),
		).toBeInTheDocument();
		expect(screen.getByText(defaultDashboardLabels.save)).toBeInTheDocument();
	});

	it("does not fire onSave while not dirty", () => {
		const h = setup({ mode: "edit", isDirty: false });
		fireEvent.click(screen.getByText(defaultDashboardLabels.save));
		expect(h.onSave).not.toHaveBeenCalled();
	});
});
