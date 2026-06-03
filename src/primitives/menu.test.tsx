import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "./menu";

describe("Menu z-index", () => {
	it("Positioner z-index participates in Chakra's layer manager", () => {
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
		expect(style).toMatch(/--layer-index/);
		expect(style).toMatch(/1500/);
	});
});
