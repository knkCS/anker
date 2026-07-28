// src/atoms/unread-badge/unread-badge.test.tsx
import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { createAnkerTheme } from "../../theme/create-theme";
import { UnreadBadge } from "./unread-badge";

// The anker system is required (not defaultSystem): the `unreadBadge` recipe
// exists only in anker's theme, and the recipe-consumption test asserts its
// styles actually land in the DOM.
const system = createAnkerTheme();
function renderWithAnkerTheme(ui: ReactElement) {
	return render(<ChakraProvider value={system}>{ui}</ChakraProvider>);
}

/**
 * All injected CSS rules whose selector targets the element's generated class.
 * Style tags accumulate across tests in this file, so a plain split-on-class
 * would leak other rules into negative assertions — extract only
 * `selector{declarations}` blocks that mention the class instead.
 */
function ruleTextFor(el: Element) {
	const cssClass = Array.from(el.classList).find((c) => c.startsWith("css-"));
	expect(cssClass).toBeDefined();
	const css = Array.from(document.querySelectorAll("style"))
		.map((s) => s.textContent ?? "")
		.join("\n");
	const ruleFor = new RegExp(`[^{}]*\\.${cssClass}[^{}]*\\{[^{}]*\\}`, "g");
	return (css.match(ruleFor) ?? []).join("\n");
}

function badgeRuleText() {
	return ruleTextFor(screen.getByTestId("unread-badge"));
}

describe("UnreadBadge", () => {
	it("renders the count", () => {
		renderWithAnkerTheme(<UnreadBadge count={3} />);
		expect(screen.getByTestId("unread-badge")).toHaveTextContent("3");
	});

	it("caps counts above max at `{max}+`", () => {
		renderWithAnkerTheme(<UnreadBadge count={128} />);
		expect(screen.getByTestId("unread-badge")).toHaveTextContent("99+");
	});

	it("honours a custom max", () => {
		renderWithAnkerTheme(<UnreadBadge count={12} max={9} />);
		expect(screen.getByTestId("unread-badge")).toHaveTextContent("9+");
	});

	it("renders nothing at zero, so callers need no guard", () => {
		const { container } = renderWithAnkerTheme(<UnreadBadge count={0} />);
		expect(container.firstChild).toBeNull();
	});

	it("consumes the registered `unreadBadge` recipe (guard against dead recipes)", () => {
		// Recipe styles are emitted under `@layer recipes`, which jsdom's
		// computed styles cannot resolve — so assert on the injected
		// stylesheet: the badge's generated class must carry the recipe's own
		// surface. This only holds if the recipe is registered in
		// create-theme.ts AND the component consumes it.
		renderWithAnkerTheme(<UnreadBadge count={3} />);
		expect(badgeRuleText()).toContain("var(--chakra-colors-gray-solid)");
	});

	it("keeps plain unread counts off the accent fill", () => {
		renderWithAnkerTheme(<UnreadBadge count={3} />);
		const rules = badgeRuleText();
		expect(rules).not.toContain("var(--chakra-colors-primary-solid)");
		expect(screen.getByTestId("unread-badge")).not.toHaveAttribute(
			"data-mention",
		);
	});

	it("marks the mention variant with the accent fill and an @ glyph", () => {
		const { container } = renderWithAnkerTheme(
			<UnreadBadge count={2} hasMention />,
		);
		const badge = screen.getByTestId("unread-badge");
		expect(badge).toHaveAttribute("data-mention", "true");
		expect(badgeRuleText()).toContain("var(--chakra-colors-primary-solid)");
		// Colour is not the only signal (WCAG 1.4.1): the glyph is decorative
		// alongside the label, so it must not be announced.
		const glyph = container.querySelector("svg");
		expect(glyph).toBeInTheDocument();
		expect(glyph).toHaveAttribute("aria-hidden", "true");
	});

	it("renders no glyph for plain unread counts", () => {
		const { container } = renderWithAnkerTheme(<UnreadBadge count={2} />);
		expect(container.querySelector("svg")).not.toBeInTheDocument();
	});

	it("names itself for screen readers, since bare digits say nothing", () => {
		renderWithAnkerTheme(<UnreadBadge count={3} />);
		expect(screen.getByRole("img", { name: "3 unread" })).toBeInTheDocument();
	});

	it("names the mention variant distinctly, and labels the capped count as shown", () => {
		const { rerender } = renderWithAnkerTheme(
			<UnreadBadge count={2} hasMention />,
		);
		expect(
			screen.getByRole("img", { name: "2 unread, mentions you" }),
		).toBeInTheDocument();

		rerender(
			<ChakraProvider value={system}>
				<UnreadBadge count={250} />
			</ChakraProvider>,
		);
		expect(screen.getByRole("img", { name: "99+ unread" })).toBeInTheDocument();
	});

	it("accepts a translated label that replaces the English default", () => {
		renderWithAnkerTheme(<UnreadBadge count={3} label="3 ungelesen" />);
		expect(
			screen.getByRole("img", { name: "3 ungelesen" }),
		).toBeInTheDocument();
		// The visible count is unchanged — only the announced name is localised.
		expect(screen.getByTestId("unread-badge")).toHaveTextContent("3");
	});
});

describe("displayName", () => {
	it("is set", () => {
		expect(UnreadBadge.displayName).toBe("UnreadBadge");
	});
});
