import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "./menu";

describe("Menu z-index", () => {
	it("Positioner z-index is 1800 (above drawer/modal layer)", () => {
		render(
			<ChakraProvider value={defaultSystem}>
				<MenuRoot open>
					<MenuTrigger>open</MenuTrigger>
					<MenuContent>
						<MenuItem value="item">Item</MenuItem>
					</MenuContent>
				</MenuRoot>
			</ChakraProvider>,
		);
		const positioner = document.querySelector(
			'[data-scope="menu"][data-part="positioner"]',
		) as HTMLElement | null;
		expect(positioner).not.toBeNull();
		const style = positioner?.getAttribute("style") ?? "";
		expect(style).toMatch(/1800/);
	});
});

describe("MenuItem disabled", () => {
	function renderItem(props: { disabled?: boolean; onClick: () => void }) {
		return render(
			<ChakraProvider value={defaultSystem}>
				<MenuRoot open>
					<MenuTrigger>open</MenuTrigger>
					<MenuContent>
						<MenuItem
							value="item"
							disabled={props.disabled}
							onClick={props.onClick}
						>
							Item
						</MenuItem>
					</MenuContent>
				</MenuRoot>
			</ChakraProvider>,
		);
	}

	it("does not run a disabled item's handler when clicked", () => {
		// The item is a div, so `disabled` is not platform-enforced, and the menu
		// recipe's `_disabled` is visual only (opacity + cursor) — a pointer click
		// used to reach the element and fire the handler. Ark already guards the
		// keyboard path.
		const onClick = vi.fn();
		renderItem({ disabled: true, onClick });

		fireEvent.click(screen.getByRole("menuitem", { name: "Item" }));

		expect(onClick).not.toHaveBeenCalled();
	});

	it("still runs an enabled item's handler", () => {
		const onClick = vi.fn();
		renderItem({ onClick });

		fireEvent.click(screen.getByRole("menuitem", { name: "Item" }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
