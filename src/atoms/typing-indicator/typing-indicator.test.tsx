// src/atoms/typing-indicator/typing-indicator.test.tsx
import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { ruleTextFor } from "../../test/recipe-styles";
import { createAnkerTheme } from "../../theme/create-theme";
import { TypingIndicator } from "./typing-indicator";

// The anker system is required (not defaultSystem): the `typingIndicator`
// recipe exists only in anker's theme, and the recipe-consumption test asserts
// its styles actually land in the DOM.
const system = createAnkerTheme();
function renderWithAnkerTheme(ui: ReactElement) {
	return render(<ChakraProvider value={system}>{ui}</ChakraProvider>);
}

const root = () => screen.getByTestId("typing-indicator");

describe("TypingIndicator", () => {
	it("names a lone typist", () => {
		renderWithAnkerTheme(<TypingIndicator names={["Alice"]} />);
		expect(root()).toHaveTextContent("Alice is typing…");
	});

	it("truncates several typists to names plus an overflow count", () => {
		renderWithAnkerTheme(
			<TypingIndicator names={["Alice", "Bob", "Cara", "Dan"]} />,
		);
		expect(root()).toHaveTextContent("Alice, Bob and 2 others are typing…");
	});

	it("honours maxNames", () => {
		renderWithAnkerTheme(
			<TypingIndicator names={["Alice", "Bob", "Cara"]} maxNames={3} />,
		);
		expect(root()).toHaveTextContent("Alice, Bob and Cara are typing…");
	});

	it("renders nothing when nobody is typing, so callers need no guard", () => {
		const { container } = renderWithAnkerTheme(<TypingIndicator names={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("holds no timers of its own — the names it is given are the whole truth", () => {
		// TTL/expiry belongs to the consumer: a name stays until it stops being
		// passed, and stale names are never dropped behind the consumer's back.
		const { rerender } = renderWithAnkerTheme(
			<TypingIndicator names={["Alice"]} />,
		);
		rerender(
			<ChakraProvider value={system}>
				<TypingIndicator names={["Bob"]} />
			</ChakraProvider>,
		);
		expect(root()).toHaveTextContent("Bob is typing…");
		expect(root()).not.toHaveTextContent("Alice");
	});

	describe("reserveSpace", () => {
		it("keeps the row mounted and marked closed when nobody is typing", () => {
			renderWithAnkerTheme(<TypingIndicator names={[]} reserveSpace />);
			expect(root()).toHaveAttribute("data-state", "closed");
			expect(root()).toHaveTextContent("");
		});

		it("marks the row open once somebody types", () => {
			renderWithAnkerTheme(<TypingIndicator names={["Alice"]} reserveSpace />);
			expect(root()).toHaveAttribute("data-state", "open");
		});

		it("fades the closed row out instead of collapsing its height", () => {
			// The row sits under a message list; collapsing it would nudge the
			// whole history every time somebody starts and stops typing.
			renderWithAnkerTheme(<TypingIndicator names={[]} reserveSpace />);
			const rules = ruleTextFor(root());
			expect(rules).toContain("min-height");
			expect(rules).toMatch(/\[data-state="closed"\][^{}]*\{[^{}]*opacity:0/);
		});
	});

	describe("localisation", () => {
		it("accepts a formatLabel that replaces the English sentence", () => {
			renderWithAnkerTheme(
				<TypingIndicator
					names={["Alice", "Bob", "Cara"]}
					formatLabel={({ named, overflowCount }) =>
						`${named.join(", ")} und ${overflowCount} weitere schreiben…`
					}
				/>,
			);
			expect(root()).toHaveTextContent("Alice, Bob und 1 weitere schreiben…");
		});

		it("gives formatLabel the truncated names, not the raw list", () => {
			// The consumer localises the sentence; the cap stays anker's job, so
			// a translated label truncates identically to the English default.
			const seen: string[][] = [];
			renderWithAnkerTheme(
				<TypingIndicator
					names={["Alice", "Bob", "Cara", "Dan"]}
					formatLabel={(summary) => {
						seen.push(summary.named);
						return "…";
					}}
				/>,
			);
			expect(seen[0]).toEqual(["Alice", "Bob"]);
		});
	});

	describe("accessibility", () => {
		it("announces itself as a polite live region", () => {
			renderWithAnkerTheme(<TypingIndicator names={["Alice"]} />);
			expect(screen.getByRole("status")).toHaveTextContent("Alice is typing…");
		});

		it("hides the dots from screen readers — the sentence already says it", () => {
			const { container } = renderWithAnkerTheme(
				<TypingIndicator names={["Alice"]} />,
			);
			const dots = container.querySelector(".typing-indicator__dots");
			expect(dots).toHaveAttribute("aria-hidden", "true");
			expect(dots?.childElementCount).toBe(3);
		});
	});

	describe("theme recipe", () => {
		it("consumes the registered `typingIndicator` recipe (guard against dead recipes)", () => {
			// Recipe styles are emitted under `@layer recipes`, which jsdom's
			// computed styles cannot resolve — so assert on the injected
			// stylesheet. This only holds if the recipe is registered in
			// create-theme.ts AND the component consumes it.
			renderWithAnkerTheme(<TypingIndicator names={["Alice"]} />);
			expect(ruleTextFor(root())).toContain("min-height");
		});

		it("bounces the dots off the registered global keyframe", () => {
			const { container } = renderWithAnkerTheme(
				<TypingIndicator names={["Alice"]} />,
			);
			const dot = container.querySelector(".typing-indicator__dot");
			expect(dot).not.toBeNull();
			// A keyframe name that no @keyframes block defines animates nothing —
			// the recipe and the globalCss registration have to agree.
			expect(ruleTextFor(dot as Element)).toContain("typingBounce");
			const css = Array.from(document.querySelectorAll("style"))
				.map((s) => s.textContent ?? "")
				.join("\n");
			expect(css).toContain("@keyframes typingBounce");
		});

		it("staggers the dots so they read as typing, not as a pulse", () => {
			const { container } = renderWithAnkerTheme(
				<TypingIndicator names={["Alice"]} />,
			);
			const rules = ruleTextFor(
				container.querySelector(".typing-indicator__dot") as Element,
			);
			expect(rules).toContain("animation-delay");
		});
	});
});

describe("displayName", () => {
	it("is set", () => {
		expect(TypingIndicator.displayName).toBe("TypingIndicator");
	});
});
