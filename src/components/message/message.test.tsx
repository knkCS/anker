// src/components/message/message.test.tsx
import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { ruleTextFor } from "../../test/recipe-styles";
import { createAnkerTheme } from "../../theme/create-theme";
import { MessageBubble } from "./message-bubble";
import { MessageGroup } from "./message-group";

// The anker system is required (not defaultSystem): the `message` slot recipe
// only exists in anker's theme, and the token-resolution tests assert that its
// styles actually land in the DOM.
const system = createAnkerTheme();
function renderWithAnkerTheme(ui: ReactElement) {
	return render(<ChakraProvider value={system}>{ui}</ChakraProvider>);
}

function bubbleRuleText() {
	return ruleTextFor(screen.getByTestId("message-bubble"));
}

describe("MessageBubble", () => {
	it("renders arbitrary segment content untouched", () => {
		renderWithAnkerTheme(
			<MessageBubble timestamp="14:03">
				<code data-testid="seg-code" data-lang="ts">
					const x = 1;
				</code>
				<div data-testid="seg-chip" role="img" aria-label="attachment">
					photo.png
				</div>
			</MessageBubble>,
		);
		const code = screen.getByTestId("seg-code");
		expect(code.tagName).toBe("CODE");
		expect(code).toHaveAttribute("data-lang", "ts");
		expect(code).toHaveTextContent("const x = 1;");
		const chip = screen.getByTestId("seg-chip");
		expect(chip).toHaveAttribute("role", "img");
		expect(chip).toHaveAttribute("aria-label", "attachment");
	});

	it("consumes the registered `message` slot recipe (guard against dead recipes)", () => {
		// A bubble outside any group renders the `other` variant: bg-surface
		// fill with a border. Recipe styles are emitted under `@layer recipes`,
		// which jsdom's computed styles cannot resolve — so assert on the
		// injected stylesheet: the element's generated class must carry the
		// recipe's bubble surface rule. This only holds if the recipe is
		// registered in create-theme.ts AND the component consumes it.
		renderWithAnkerTheme(<MessageBubble timestamp="14:03">hi</MessageBubble>);
		expect(bubbleRuleText()).toContain("var(--chakra-colors-bg-surface)");
		expect(bubbleRuleText()).toContain("border-width:1px");
	});

	it("appends the edited marker to the timestamp", () => {
		renderWithAnkerTheme(
			<MessageBubble timestamp="14:03" isEdited>
				hi
			</MessageBubble>,
		);
		expect(screen.getByTestId("message-timestamp")).toHaveTextContent(
			"14:03 · edited",
		);
	});

	it("renders the edited marker alone when there is no timestamp", () => {
		renderWithAnkerTheme(
			<MessageBubble isEdited editedLabel="bearbeitet">
				hi
			</MessageBubble>,
		);
		const ts = screen.getByTestId("message-timestamp");
		expect(ts).toHaveTextContent("bearbeitet");
		expect(ts.textContent).not.toContain("·");
	});

	it("isDeleted replaces the message with the tombstone line", () => {
		renderWithAnkerTheme(
			<MessageBubble
				timestamp="14:03"
				isDeleted
				actions={
					<button type="button" data-testid="action-btn">
						reply
					</button>
				}
			>
				<span data-testid="seg">secret</span>
			</MessageBubble>,
		);
		expect(screen.getByTestId("message-tombstone")).toHaveTextContent(
			"Message deleted · 14:03",
		);
		expect(screen.queryByTestId("seg")).not.toBeInTheDocument();
		expect(screen.queryByTestId("action-btn")).not.toBeInTheDocument();
		expect(screen.queryByTestId("message-bubble")).not.toBeInTheDocument();
	});

	it("tombstone renders the label alone when there is no timestamp", () => {
		renderWithAnkerTheme(
			<MessageBubble isDeleted deletedLabel="Nachricht gelöscht">
				hi
			</MessageBubble>,
		);
		const tombstone = screen.getByTestId("message-tombstone");
		expect(tombstone).toHaveTextContent("Nachricht gelöscht");
		expect(tombstone.textContent).not.toContain("·");
	});

	it("renders no toolbar when actions are not provided", () => {
		renderWithAnkerTheme(<MessageBubble timestamp="14:03">hi</MessageBubble>);
		expect(screen.queryByTestId("message-toolbar")).not.toBeInTheDocument();
	});

	it("renders consumer actions in the floating toolbar", () => {
		renderWithAnkerTheme(
			<MessageBubble
				timestamp="14:03"
				actions={
					<button type="button" data-testid="action-btn">
						Reply
					</button>
				}
			>
				hi
			</MessageBubble>,
		);
		expect(screen.getByTestId("message-toolbar")).toContainElement(
			screen.getByTestId("action-btn"),
		);
	});
});

describe("MessageGroup", () => {
	it("renders author and avatar exactly once for a multi-bubble run", () => {
		renderWithAnkerTheme(
			<MessageGroup
				author="Ada Lovelace"
				avatar={<span data-testid="avatar" />}
			>
				<MessageBubble timestamp="14:01">one</MessageBubble>
				<MessageBubble timestamp="14:02">two</MessageBubble>
				<MessageBubble timestamp="14:03">three</MessageBubble>
			</MessageGroup>,
		);
		expect(screen.getAllByText("Ada Lovelace")).toHaveLength(1);
		expect(screen.getAllByTestId("avatar")).toHaveLength(1);
		expect(screen.getAllByTestId("message-bubble")).toHaveLength(3);
	});

	it("tints child bubbles via context in an isSelf group — no bubble prop", () => {
		renderWithAnkerTheme(
			<MessageGroup isSelf>
				<MessageBubble timestamp="14:03">mine</MessageBubble>
			</MessageGroup>,
		);
		// Self bubbles use the soft primary tint, not the bordered surface.
		expect(bubbleRuleText()).toContain("var(--chakra-colors-primary-subtle)");
	});
});

describe("displayName", () => {
	it("is set on both components", () => {
		expect(MessageBubble.displayName).toBe("MessageBubble");
		expect(MessageGroup.displayName).toBe("MessageGroup");
	});
});
