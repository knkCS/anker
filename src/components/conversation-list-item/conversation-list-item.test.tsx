// src/components/conversation-list-item/conversation-list-item.test.tsx
import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { createAnkerTheme } from "../../theme/create-theme";
import { ConversationListItem } from "./conversation-list-item";

// The anker system is required (not defaultSystem): the `conversationListItem`
// slot recipe only exists in anker's theme, and the token-resolution tests
// assert that its styles actually land in the DOM.
const system = createAnkerTheme();
function renderWithAnkerTheme(ui: ReactElement) {
	return render(<ChakraProvider value={system}>{ui}</ChakraProvider>);
}

/**
 * All injected CSS rules whose selector targets the rendered root's generated
 * class. Style tags accumulate across tests in this file, so a plain
 * split-on-class would leak other rules into negative assertions — extract
 * only `selector{declarations}` blocks that mention the class instead.
 */
function rootRuleText() {
	const root = screen.getByTestId("conversation-list-item");
	const cssClass = Array.from(root.classList).find((c) => c.startsWith("css-"));
	expect(cssClass).toBeDefined();
	const css = Array.from(document.querySelectorAll("style"))
		.map((s) => s.textContent ?? "")
		.join("\n");
	const ruleFor = new RegExp(`[^{}]*\\.${cssClass}[^{}]*\\{[^{}]*\\}`, "g");
	return (css.match(ruleFor) ?? []).join("\n");
}

describe("ConversationListItem", () => {
	it("renders title and passes preview, avatar, and badge slots through untouched", () => {
		renderWithAnkerTheme(
			<ConversationListItem
				title="Design weekly"
				preview={
					<em data-testid="slot-preview" data-kind="typing">
						Grace is typing…
					</em>
				}
				avatar={<span data-testid="slot-avatar" role="img" aria-label="DW" />}
				badge={<span data-testid="slot-badge">3</span>}
				timestamp="14:03"
			/>,
		);
		expect(screen.getByText("Design weekly")).toBeInTheDocument();
		const preview = screen.getByTestId("slot-preview");
		expect(preview.tagName).toBe("EM");
		expect(preview).toHaveAttribute("data-kind", "typing");
		expect(screen.getByTestId("slot-avatar")).toHaveAttribute(
			"aria-label",
			"DW",
		);
		expect(screen.getByTestId("slot-badge")).toHaveTextContent("3");
		expect(screen.getByText("14:03")).toBeInTheDocument();
	});

	it("consumes the registered `conversationListItem` slot recipe (guard against dead recipes)", () => {
		// Recipe styles are emitted under `@layer recipes`, which jsdom's
		// computed styles cannot resolve — so assert on the injected
		// stylesheet: the root's generated class must carry the recipe's
		// hover surface rule. This only holds if the recipe is registered in
		// create-theme.ts AND the component consumes it.
		renderWithAnkerTheme(<ConversationListItem title="Design weekly" />);
		expect(rootRuleText()).toContain("var(--chakra-colors-bg-subtle)");
	});

	it("marks the selected row with aria-current and the soft primary tint", () => {
		renderWithAnkerTheme(
			<ConversationListItem title="Design weekly" isSelected />,
		);
		const root = screen.getByTestId("conversation-list-item");
		expect(root).toHaveAttribute("aria-current", "true");
		// Soft tint, not an inverted accent surface — default text stays readable.
		expect(rootRuleText()).toContain("var(--chakra-colors-primary-subtle)");
	});

	it("unselected rows carry neither aria-current nor the selected tint", () => {
		renderWithAnkerTheme(<ConversationListItem title="Design weekly" />);
		const root = screen.getByTestId("conversation-list-item");
		expect(root).not.toHaveAttribute("aria-current");
		expect(rootRuleText()).not.toContain("var(--chakra-colors-primary-subtle)");
	});

	it("is a native button that reports clicks via onSelect", async () => {
		const onSelect = vi.fn();
		renderWithAnkerTheme(
			<ConversationListItem title="Design weekly" onSelect={onSelect} />,
		);
		const root = screen.getByTestId("conversation-list-item");
		// Native button => keyboard activation (Enter/Space) comes for free.
		expect(root.tagName).toBe("BUTTON");
		expect(root).toHaveAttribute("type", "button");
		await userEvent.click(root);
		expect(onSelect).toHaveBeenCalledTimes(1);
	});

	it("renders no avatar or preview-row containers when those slots are absent", () => {
		const { container } = renderWithAnkerTheme(
			<ConversationListItem title="Design weekly" timestamp="14:03" />,
		);
		expect(
			container.querySelector(".conversation-list-item__avatar"),
		).not.toBeInTheDocument();
		expect(
			container.querySelector(".conversation-list-item__preview-row"),
		).not.toBeInTheDocument();
	});

	it("truncates title and preview to a single line via the recipe", () => {
		const { container } = renderWithAnkerTheme(
			<ConversationListItem
				title="A very long conversation title that will not fit"
				preview="An equally long last-message preview that will not fit either"
			/>,
		);
		for (const slot of ["title", "preview"]) {
			const el = container.querySelector(`.conversation-list-item__${slot}`);
			expect(el).toBeInTheDocument();
			const cssClass = Array.from((el as Element).classList).find((c) =>
				c.startsWith("css-"),
			);
			const css = Array.from(document.querySelectorAll("style"))
				.map((s) => s.textContent ?? "")
				.join("\n");
			const rules = (
				css.match(new RegExp(`[^{}]*\\.${cssClass}[^{}]*\\{[^{}]*\\}`, "g")) ??
				[]
			).join("\n");
			expect(rules).toContain("text-overflow:ellipsis");
			expect(rules).toContain("white-space:nowrap");
		}
	});
});

describe("displayName", () => {
	it("is set", () => {
		expect(ConversationListItem.displayName).toBe("ConversationListItem");
	});
});
