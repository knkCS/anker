import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { MenuButton } from "./menu-button";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("MenuButton", () => {
	it("renders the empty label and no button when there are no actions", () => {
		renderWithChakra(
			<MenuButton
				actions={[]}
				menuLabel="Move to…"
				emptyLabel="No transitions"
			/>,
		);
		expect(screen.getByText("No transitions")).toBeInTheDocument();
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("renders a single plain button that fires its action on click", () => {
		const onClick = vi.fn();
		renderWithChakra(
			<MenuButton
				menuLabel="Move to…"
				actions={[{ label: "Move to In Review", onClick }]}
			/>,
		);
		const button = screen.getByRole("button", { name: "Move to In Review" });
		expect(button.getAttribute("aria-haspopup")).toBeNull();
		fireEvent.click(button);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("collapses 2+ actions behind one menu trigger showing menuLabel", () => {
		renderWithChakra(
			<MenuButton
				menuLabel="Move to…"
				actions={[
					{ label: "In Review", onClick: vi.fn() },
					{ label: "Approved", onClick: vi.fn() },
				]}
			/>,
		);
		const buttons = screen.getAllByRole("button");
		expect(buttons).toHaveLength(1);
		expect(buttons[0]).toHaveTextContent("Move to…");
		expect(buttons[0].getAttribute("aria-haspopup")).not.toBeNull();
	});

	it("fires the clicked action when a menu item is selected", async () => {
		const onInReview = vi.fn();
		renderWithChakra(
			<MenuButton
				menuLabel="Move to…"
				actions={[
					{ label: "In Review", onClick: onInReview },
					{ label: "Approved", onClick: vi.fn() },
				]}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Move to…" }));
		fireEvent.click(await screen.findByRole("menuitem", { name: "In Review" }));
		expect(onInReview).toHaveBeenCalledTimes(1);
	});
});
