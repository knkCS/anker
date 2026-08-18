import { ChakraProvider } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import system from "../../theme";
import { Stepper, StepperStep } from "./stepper";

/**
 * Every Stepper slot carries its own recipe styles via `css`. Half the slots
 * used to apply `css` before `{...rest}` — a consumer's `css` replaced the slot
 * styling outright — and half applied it after, silently dropping it. Neither
 * merged.
 *
 * The assertions read the CSS text Chakra emitted for the element's generated
 * class rather than computed styles: jsdom cannot parse Chakra's layered
 * stylesheets, so `getComputedStyle` reports the recipe's declarations as
 * absent whether they are there or not.
 */
function rulesFor(element: HTMLElement): string {
	const generated = element.className
		.split(" ")
		.find((name) => name.startsWith("css-"));
	if (!generated) throw new Error("element carries no generated class");

	return Array.from(document.querySelectorAll("style"))
		.flatMap((tag) => (tag.textContent ?? "").split("\n"))
		.filter((line) => line.includes(`.${generated}`))
		.join("\n");
}

function renderStepper(css?: Record<string, unknown>) {
	// anker's own system, not `defaultSystem` — the stepper slot recipe only
	// exists here, and without it there are no slot styles to preserve.
	const { container } = render(
		<ChakraProvider value={system}>
			<Stepper step={0} css={css}>
				<StepperStep name="one" title="One" />
				<StepperStep name="two" title="Two" />
			</Stepper>
		</ChakraProvider>,
	);
	return rulesFor(container.querySelector(".stepper") as HTMLElement);
}

describe("Stepper css merging", () => {
	it("emits a consumer's css instead of discarding it", () => {
		expect(renderStepper({ opacity: 0.5 })).toContain("opacity:0.5");
	});

	it("keeps the slot's own recipe styles alongside it", () => {
		const rules = renderStepper({ opacity: 0.5 });

		expect(rules).toContain("flex-direction:column");
		expect(rules).toContain("opacity:0.5");
	});

	it("leaves the slot's styles intact when no css is passed", () => {
		expect(renderStepper()).toContain("flex-direction:column");
	});
});
