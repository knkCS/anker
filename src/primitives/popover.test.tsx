import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

describe("Popover z-index", () => {
	it("Positioner z-index is 1800 (above drawer/modal layer)", () => {
		render(
			<ChakraProvider value={defaultSystem}>
				<Popover open>
					<PopoverTrigger>open</PopoverTrigger>
					<PopoverContent>content</PopoverContent>
				</Popover>
			</ChakraProvider>,
		);
		const positioner = document.querySelector(
			'[data-scope="popover"][data-part="positioner"]',
		) as HTMLElement | null;
		expect(positioner).not.toBeNull();
		const style = positioner?.getAttribute("style") ?? "";
		expect(style).toMatch(/1800/);
	});
});
