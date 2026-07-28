import { expect } from "vitest";

/**
 * All injected CSS rules whose selector targets the element's generated class.
 *
 * Recipe styles are emitted under `@layer recipes`, which jsdom's computed
 * styles cannot resolve — asserting on the injected stylesheet is the only way
 * to prove a component actually consumes its registered recipe rather than
 * silently falling back to Chakra's default (the anker#153 dead-registration
 * class of bug).
 *
 * Style tags accumulate across tests in a file, so a plain split-on-class
 * would leak other rules into negative assertions — only `selector{declarations}`
 * blocks that mention the class are extracted.
 */
export function ruleTextFor(el: Element) {
	const cssClass = Array.from(el.classList).find((c) => c.startsWith("css-"));
	expect(cssClass).toBeDefined();
	const css = Array.from(document.querySelectorAll("style"))
		.map((s) => s.textContent ?? "")
		.join("\n");
	const ruleFor = new RegExp(`[^{}]*\\.${cssClass}[^{}]*\\{[^{}]*\\}`, "g");
	return (css.match(ruleFor) ?? []).join("\n");
}
