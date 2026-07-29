import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ruleTextFor } from "../../test/recipe-styles";
import { createAnkerTheme } from "../../theme/create-theme";
import { DEFAULT_REACTION_QUICK_SET } from "./quick-set";
import { ReactionChips } from "./reaction-chips";
import { ReactionQuickSetPopover } from "./reaction-quick-set-popover";

// The anker system is required (not defaultSystem): the `reactionChips` and
// `reactionQuickSet` recipes exist only in anker's theme, and the
// recipe-consumption tests assert their styles actually land in the DOM.
const system = createAnkerTheme();
function renderWithAnkerTheme(ui: ReactElement) {
	return render(<ChakraProvider value={system}>{ui}</ChakraProvider>);
}

const chips = () => screen.getAllByTestId("reaction-chip");

describe("ReactionChips", () => {
	it("renders one chip per reaction, each with its emoji and count", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[
					{ emoji: "👍", count: 3 },
					{ emoji: "🎉", count: 1 },
				]}
				onToggle={vi.fn()}
			/>,
		);

		expect(chips()).toHaveLength(2);
		expect(chips()[0]).toHaveTextContent("👍");
		expect(chips()[0]).toHaveTextContent("3");
		expect(chips()[1]).toHaveTextContent("🎉");
		expect(chips()[1]).toHaveTextContent("1");
	});

	it("reports which emoji was toggled, leaving add-or-remove to the consumer", () => {
		const onToggle = vi.fn();
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[
					{ emoji: "👍", count: 3 },
					{ emoji: "🎉", count: 1, reactedByMe: true },
				]}
				onToggle={onToggle}
			/>,
		);

		fireEvent.click(chips()[1]);

		expect(onToggle).toHaveBeenCalledTimes(1);
		// The already-reacted chip reports the same way as a fresh one — the
		// chip knows which reaction was hit, not what should happen next.
		expect(onToggle).toHaveBeenCalledWith("🎉");
	});

	it("marks the viewer's own reactions as pressed toggle buttons", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[
					{ emoji: "👍", count: 3, reactedByMe: true },
					{ emoji: "🎉", count: 1 },
				]}
				onToggle={vi.fn()}
			/>,
		);

		// aria-pressed is what carries reacted-by-me to assistive tech; the
		// tint is the sighted half of the same state.
		expect(chips()[0]).toHaveAttribute("aria-pressed", "true");
		expect(chips()[1]).toHaveAttribute("aria-pressed", "false");
	});

	it("names each chip for screen readers, since a bare glyph announces inconsistently", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[
					{ emoji: "👍", count: 3, label: "thumbs up" },
					{ emoji: "🎉", count: 1, label: "party popper" },
				]}
				onToggle={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "thumbs up, 3 reactions" }),
		).toBeInTheDocument();
		// Singular, and no ", you reacted" tail — aria-pressed already says so,
		// and repeating it would have screen readers announce it twice.
		expect(
			screen.getByRole("button", { name: "party popper, 1 reaction" }),
		).toBeInTheDocument();
	});

	it("falls back to the glyph when a reaction carries no label", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[{ emoji: "👍", count: 2 }]}
				onToggle={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "👍, 2 reactions" }),
		).toBeInTheDocument();
	});

	it("accepts a translated chip label that replaces the English default", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[{ emoji: "👍", count: 3, label: "Daumen hoch" }]}
				onToggle={vi.fn()}
				formatChipLabel={({ label, count }) => `${label}, ${count} Reaktionen`}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Daumen hoch, 3 Reaktionen" }),
		).toBeInTheDocument();
		// Only the announced name is localised — the visible chip is unchanged.
		expect(chips()[0]).toHaveTextContent("3");
	});

	it("folds reactions past maxVisible into a single overflow chip", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={["👍", "🎉", "😂", "🔥", "🚀"].map((emoji) => ({
					emoji,
					count: 1,
				}))}
				onToggle={vi.fn()}
				maxVisible={3}
			/>,
		);

		expect(chips()).toHaveLength(3);
		expect(screen.getByTestId("reaction-chip-overflow")).toHaveTextContent(
			"+2",
		);
	});

	it("renders no overflow chip when everything fits", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[{ emoji: "👍", count: 1 }]}
				onToggle={vi.fn()}
			/>,
		);

		expect(
			screen.queryByTestId("reaction-chip-overflow"),
		).not.toBeInTheDocument();
	});

	it("leaves the overflow chip inert when the consumer offers no way to expand it", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={["👍", "🎉", "😂"].map((emoji) => ({ emoji, count: 1 }))}
				onToggle={vi.fn()}
				maxVisible={1}
			/>,
		);

		// A button that does nothing is worse than no button: it takes a tab
		// stop and promises an action that never happens.
		const overflow = screen.getByTestId("reaction-chip-overflow");
		expect(overflow.tagName).toBe("SPAN");
		expect(
			screen.getByRole("img", { name: "2 more reactions" }),
		).toBeInTheDocument();
	});

	it("makes the overflow chip a real button once onShowAll is given", () => {
		const onShowAll = vi.fn();
		renderWithAnkerTheme(
			<ReactionChips
				reactions={["👍", "🎉", "😂"].map((emoji) => ({ emoji, count: 1 }))}
				onToggle={vi.fn()}
				maxVisible={2}
				onShowAll={onShowAll}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "1 more reaction" }));
		expect(onShowAll).toHaveBeenCalledTimes(1);
	});

	it("accepts a translated overflow label", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={["👍", "🎉", "😂"].map((emoji) => ({ emoji, count: 1 }))}
				onToggle={vi.fn()}
				maxVisible={1}
				formatOverflowLabel={(hidden) => `${hidden} weitere Reaktionen`}
			/>,
		);

		expect(
			screen.getByRole("img", { name: "2 weitere Reaktionen" }),
		).toBeInTheDocument();
	});

	it("renders the addAction slot last, after the chips", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[{ emoji: "👍", count: 1 }]}
				onToggle={vi.fn()}
				addAction={<button type="button">add</button>}
			/>,
		);

		const row = screen.getByTestId("reaction-chips");
		expect(row.lastElementChild).toHaveTextContent("add");
	});

	it("renders nothing at all when there is nothing to show, so callers need no guard", () => {
		const { container } = renderWithAnkerTheme(
			<ReactionChips reactions={[]} onToggle={vi.fn()} />,
		);

		expect(container.firstChild).toBeNull();
	});

	it("still renders the row for an unreacted message when an addAction is offered", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[]}
				onToggle={vi.fn()}
				addAction={<button type="button">add</button>}
			/>,
		);

		// Otherwise there would be no way to add the first reaction.
		expect(screen.getByTestId("reaction-chips")).toBeInTheDocument();
	});

	it("disables every chip it owns for a read-only conversation", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={["👍", "🎉", "😂"].map((emoji) => ({ emoji, count: 1 }))}
				onToggle={vi.fn()}
				maxVisible={2}
				onShowAll={vi.fn()}
				disabled
			/>,
		);

		for (const chip of chips()) expect(chip).toBeDisabled();
		expect(screen.getByTestId("reaction-chip-overflow")).toBeDisabled();
	});

	it("consumes the registered `reactionChips` recipe (guard against dead recipes)", () => {
		// Recipe styles are emitted under `@layer recipes`, which jsdom's
		// computed styles cannot resolve — so assert on the injected
		// stylesheet: the chip's generated class must carry the recipe's own
		// surface. This only holds if the recipe is registered in
		// create-theme.ts AND the component consumes it.
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[{ emoji: "👍", count: 1 }]}
				onToggle={vi.fn()}
			/>,
		);

		expect(ruleTextFor(chips()[0])).toContain(
			"var(--chakra-colors-bg-surface)",
		);
	});

	it("tints the viewer's own reactions, and leaves the others alone", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[
					{ emoji: "👍", count: 1, reactedByMe: true },
					{ emoji: "🎉", count: 1 },
				]}
				onToggle={vi.fn()}
			/>,
		);

		// primary.subtle, never bg-accent-subtle: the latter is an inverted
		// accent surface that would swallow the chip's own text.
		expect(ruleTextFor(chips()[0])).toContain(
			"var(--chakra-colors-primary-subtle)",
		);
		expect(ruleTextFor(chips()[1])).not.toContain(
			"var(--chakra-colors-primary-subtle)",
		);
	});

	it("carries a second, non-colour signal for the reacted state (WCAG 1.4.1)", () => {
		const { container } = renderWithAnkerTheme(
			<ReactionChips
				reactions={[{ emoji: "👍", count: 1, reactedByMe: true }]}
				onToggle={vi.fn()}
			/>,
		);

		// The count is bold on a reacted chip, so the state survives greyscale
		// and colour-blindness — the same line unread-badge draws around its
		// `@` glyph.
		const count = container.querySelector(".reaction-chips__count");
		expect(count).not.toBeNull();
		expect(ruleTextFor(count as Element)).toContain(
			"var(--chakra-font-weights-bold)",
		);
	});

	it("keeps the chips' hit area at the 44px minimum without inflating them", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[{ emoji: "👍", count: 1 }]}
				onToggle={vi.fn()}
			/>,
		);

		// WCAG 2.5.8 via the button recipe's invisible pseudo — a chip that is
		// really 44px tall dwarfs the message it hangs under.
		expect(ruleTextFor(chips()[0])).toContain("min-height:44px");
	});

	it("focuses with the shared focus-ring shadow, not a colour-token outline", () => {
		// `focus-ring` is a shadow token: as `outlineColor` it resolves to the
		// literal string and the declaration is dropped, leaving the ring at
		// currentColor. Same shape as button/composer/conversation-list-item.
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[{ emoji: "\u{1F44D}", count: 1 }]}
				onToggle={vi.fn()}
			/>,
		);

		const rules = ruleTextFor(chips()[0]);
		expect(rules).toContain("var(--chakra-shadows-focus-ring)");
		expect(rules).not.toContain("outline-color:focus-ring");
	});

	it("strips the control affordances from the inert overflow readout", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={["\u{1F44D}", "\u{1F389}", "\u{1F602}"].map((emoji) => ({
					emoji,
					count: 1,
				}))}
				onToggle={vi.fn()}
				maxVisible={1}
			/>,
		);

		// It keeps the chip's shape so the row stays even, but a readout must
		// not claim a pointer cursor or a 44px hit area. The hit area is a
		// generated ::after, so `content: none` is what removes it — the
		// inherited min-width/min-height stay in the rule text but style a box
		// that is never created.
		const rules = ruleTextFor(screen.getByTestId("reaction-chip-overflow"));
		expect(rules).toContain("cursor:default");
		expect(rules).toContain("content:none");
	});

	it("keeps the 44px hit area on the overflow chip once it is a real button", () => {
		renderWithAnkerTheme(
			<ReactionChips
				reactions={["\u{1F44D}", "\u{1F389}", "\u{1F602}"].map((emoji) => ({
					emoji,
					count: 1,
				}))}
				onToggle={vi.fn()}
				maxVisible={1}
				onShowAll={vi.fn()}
			/>,
		);

		const rules = ruleTextFor(screen.getByTestId("reaction-chip-overflow"));
		expect(rules).toContain("min-height:44px");
		// The pseudo is actually generated here, unlike the inert readout.
		expect(rules).not.toContain("content:none");
	});

	it("does not fire onToggle from a disabled chip", () => {
		const onToggle = vi.fn();
		renderWithAnkerTheme(
			<ReactionChips
				reactions={[{ emoji: "👍", count: 1 }]}
				onToggle={onToggle}
				disabled
			/>,
		);

		fireEvent.click(chips()[0]);
		expect(onToggle).not.toHaveBeenCalled();
	});
});

const options = () => screen.getAllByTestId("reaction-quick-set-option");

describe("DEFAULT_REACTION_QUICK_SET", () => {
	it("is a curated set of roughly sixteen emoji", () => {
		expect(DEFAULT_REACTION_QUICK_SET).toHaveLength(16);
	});

	it("names every emoji, so no option is announced as a bare glyph", () => {
		for (const option of DEFAULT_REACTION_QUICK_SET) {
			expect(option.label.trim()).not.toBe("");
		}
	});

	it("holds no duplicate glyph, which would collide as a React key", () => {
		const glyphs = DEFAULT_REACTION_QUICK_SET.map((o) => o.emoji);
		expect(new Set(glyphs).size).toBe(glyphs.length);
	});
});

describe("ReactionQuickSetPopover", () => {
	it("offers the full quick set once opened", () => {
		renderWithAnkerTheme(<ReactionQuickSetPopover onSelect={vi.fn()} open />);

		expect(options()).toHaveLength(DEFAULT_REACTION_QUICK_SET.length);
		expect(options()[0]).toHaveTextContent(DEFAULT_REACTION_QUICK_SET[0].emoji);
	});

	it("takes a caller-supplied set in place of the default", () => {
		renderWithAnkerTheme(
			<ReactionQuickSetPopover
				onSelect={vi.fn()}
				open
				options={[
					{ emoji: "👍", label: "thumbs up" },
					{ emoji: "🎉", label: "party popper" },
				]}
			/>,
		);

		expect(options()).toHaveLength(2);
	});

	it("names each option and hides the glyph from the accessible name", () => {
		renderWithAnkerTheme(
			<ReactionQuickSetPopover
				onSelect={vi.fn()}
				open
				options={[{ emoji: "👍", label: "thumbs up" }]}
			/>,
		);

		const option = screen.getByRole("button", { name: "thumbs up" });
		expect(option.querySelector("[aria-hidden='true']")).toHaveTextContent(
			"👍",
		);
	});

	it("reports the chosen emoji", () => {
		const onSelect = vi.fn();
		renderWithAnkerTheme(
			<ReactionQuickSetPopover
				onSelect={onSelect}
				open
				options={[
					{ emoji: "👍", label: "thumbs up" },
					{ emoji: "🎉", label: "party popper" },
				]}
			/>,
		);

		fireEvent.click(options()[1]);

		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect).toHaveBeenCalledWith("🎉");
	});

	it("closes itself once a reaction is picked", async () => {
		const onOpenChange = vi.fn();
		renderWithAnkerTheme(
			<ReactionQuickSetPopover
				onSelect={vi.fn()}
				open
				onOpenChange={onOpenChange}
				options={[{ emoji: "👍", label: "thumbs up" }]}
			/>,
		);

		fireEvent.click(options()[0]);

		// Picking one reaction and leaving the sheet open would have the
		// consumer close it by hand at every call site.
		await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
	});

	it("ships a labelled trigger that opens the set", async () => {
		renderWithAnkerTheme(<ReactionQuickSetPopover onSelect={vi.fn()} />);

		expect(screen.queryByTestId("reaction-quick-set")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Add reaction" }));

		await waitFor(() => expect(options()).toHaveLength(16));
	});

	it("accepts a caller's own trigger", async () => {
		renderWithAnkerTheme(
			<ReactionQuickSetPopover
				onSelect={vi.fn()}
				trigger={<button type="button">React…</button>}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "React…" }));
		await waitFor(() => expect(options()).toHaveLength(16));
	});

	it("localises the trigger and the set's own name", () => {
		renderWithAnkerTheme(
			<ReactionQuickSetPopover
				onSelect={vi.fn()}
				open
				label="Reaktion hinzufügen"
			/>,
		);

		expect(
			screen.getByRole("group", { name: "Reaktion hinzufügen" }),
		).toBeInTheDocument();
	});

	it("consumes the registered `reactionQuickSet` recipe (guard against dead recipes)", () => {
		renderWithAnkerTheme(
			<ReactionQuickSetPopover
				onSelect={vi.fn()}
				open
				options={[{ emoji: "👍", label: "thumbs up" }]}
			/>,
		);

		// The options meet the 44px touch target outright rather than via the
		// button recipe's pseudo — they are on a grid, so it costs no room.
		const rules = ruleTextFor(options()[0]);
		expect(rules).toContain("min-width:44px");
		expect(rules).toContain("min-height:44px");
	});

	it("focuses options with the shared focus-ring shadow", () => {
		renderWithAnkerTheme(
			<ReactionQuickSetPopover
				onSelect={vi.fn()}
				open
				options={[{ emoji: "\u{1F44D}", label: "thumbs up" }]}
			/>,
		);

		const rules = ruleTextFor(options()[0]);
		expect(rules).toContain("var(--chakra-shadows-focus-ring)");
		expect(rules).not.toContain("outline-color:focus-ring");
	});

	it("cannot be opened while disabled", () => {
		renderWithAnkerTheme(
			<ReactionQuickSetPopover onSelect={vi.fn()} disabled />,
		);

		const trigger = screen.getByRole("button", { name: "Add reaction" });
		expect(trigger).toBeDisabled();
		fireEvent.click(trigger);
		expect(screen.queryByTestId("reaction-quick-set")).not.toBeInTheDocument();
	});
});
