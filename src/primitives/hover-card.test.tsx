import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HoverCard } from "./hover-card";

describe("HoverCard z-index", () => {
	it("Positioner z-index is 1800 (above drawer/modal layer)", () => {
		render(
			<ChakraProvider value={defaultSystem}>
				<HoverCard open content={<span>card content</span>}>
					<span>trigger</span>
				</HoverCard>
			</ChakraProvider>,
		);
		const positioner = document.querySelector(
			'[data-scope="hover-card"][data-part="positioner"]',
		) as HTMLElement | null;
		expect(positioner).not.toBeNull();
		const style = positioner?.getAttribute("style") ?? "";
		expect(style).toMatch(/1800/);
	});
});
