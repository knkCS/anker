import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { SplitButton } from "./split-button";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

const menuItems = [
	{ label: "Create from template", onClick: vi.fn() },
	{ label: "Import", onClick: vi.fn() },
];

describe("SplitButton", () => {
	it("renders both halves", () => {
		renderWithChakra(
			<SplitButton
				label="Create task"
				onClick={vi.fn()}
				menuAriaLabel="Choose a task type"
				menuItems={menuItems}
			/>,
		);

		expect(screen.getAllByRole("button")).toHaveLength(2);
	});

	it("gives the icon-only chevron half an accessible name", () => {
		renderWithChakra(
			<SplitButton
				label="Create task"
				onClick={vi.fn()}
				menuAriaLabel="Choose a task type"
				menuItems={menuItems}
			/>,
		);

		const trigger = screen.getByRole("button", { name: "Choose a task type" });
		expect(trigger.getAttribute("aria-haspopup")).not.toBeNull();
	});

	it("runs the default action from the action half", () => {
		const onClick = vi.fn();
		renderWithChakra(
			<SplitButton
				label="Create task"
				onClick={onClick}
				menuAriaLabel="Choose a task type"
				menuItems={menuItems}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Create task" }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("fires the chosen alternative from the menu", async () => {
		const onImport = vi.fn();
		renderWithChakra(
			<SplitButton
				label="Create task"
				onClick={vi.fn()}
				menuAriaLabel="Choose a task type"
				menuItems={[{ label: "Import", onClick: onImport }]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Choose a task type" }));
		fireEvent.click(await screen.findByRole("menuitem", { name: "Import" }));

		expect(onImport).toHaveBeenCalledTimes(1);
	});

	it("does not fire a disabled menu item", async () => {
		const onImport = vi.fn();
		renderWithChakra(
			<SplitButton
				label="Create task"
				onClick={vi.fn()}
				menuAriaLabel="Choose a task type"
				menuItems={[{ label: "Import", onClick: onImport, disabled: true }]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Choose a task type" }));
		fireEvent.click(await screen.findByRole("menuitem", { name: "Import" }));

		expect(onImport).not.toHaveBeenCalled();
	});

	it("keeps items with colliding labels distinct via value", async () => {
		renderWithChakra(
			<SplitButton
				label="Export"
				onClick={vi.fn()}
				menuAriaLabel="Choose an export format"
				menuItems={[
					{ label: "Export", value: "csv", onClick: vi.fn() },
					{ label: "Export", value: "xlsx", onClick: vi.fn() },
				]}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Choose an export format" }),
		);

		expect(
			await screen.findAllByRole("menuitem", { name: "Export" }),
		).toHaveLength(2);
	});

	it("renders no leading icon unless one is passed", () => {
		const { rerender } = renderWithChakra(
			<SplitButton
				label="Create task"
				onClick={vi.fn()}
				menuAriaLabel="Choose a task type"
				menuItems={menuItems}
			/>,
		);
		const action = screen.getByRole("button", { name: "Create task" });
		// Only the chevron half carries an svg when no icon is supplied.
		expect(action.querySelector("svg")).toBeNull();

		rerender(
			<ChakraProvider value={defaultSystem}>
				<SplitButton
					label="Create task"
					onClick={vi.fn()}
					menuAriaLabel="Choose a task type"
					menuItems={menuItems}
					icon={<svg data-testid="leading-icon" aria-hidden="true" />}
				/>
			</ChakraProvider>,
		);

		// Scoped to the action half — a document-wide query would also pass if the
		// icon landed on the chevron half.
		expect(
			screen
				.getByRole("button", { name: "Create task" })
				.querySelector("[data-testid='leading-icon']"),
		).not.toBeNull();
	});

	it("disables the chevron half while the default action is loading", () => {
		renderWithChakra(
			<SplitButton
				label="Create task"
				onClick={vi.fn()}
				menuAriaLabel="Choose a task type"
				menuItems={menuItems}
				loading
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Choose a task type" }),
		).toBeDisabled();
	});
});
