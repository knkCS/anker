import type { ReactNode } from "react";

/**
 * One aggregated reaction on a message: an emoji and how many people picked
 * it. Already aggregated by the consumer — anker never sees who reacted.
 */
export interface ReactionSummary {
	/** The emoji glyph, e.g. `"👍"`. Identifies the chip. */
	emoji: string;
	/** How many people reacted with it. Below 1 the chip is dropped entirely. */
	count: number;
	/**
	 * Whether the viewer is one of them — the chip reads as pressed.
	 * @default false
	 */
	reactedByMe?: boolean;
	/**
	 * The emoji's human name, e.g. `"thumbs up"`. Used to build the chip's
	 * accessible name, since a bare glyph is announced inconsistently (or not
	 * at all). Defaults to the glyph itself.
	 */
	label?: string;
}

export interface ReactionChipsProps {
	/**
	 * The message's aggregated reactions, in the order they should render.
	 * anker never re-sorts them — it cannot know whether you mean "most
	 * popular first" or "first reacted first".
	 */
	reactions: readonly ReactionSummary[];
	/**
	 * Fires with the emoji of the chip that was activated. Add or remove is
	 * the consumer's call: the chip only reports which reaction was toggled.
	 */
	onToggle: (emoji: string) => void;
	/**
	 * Highest number of chips rendered verbatim; the rest fold into a single
	 * `+N` chip. A hard cap — nine reactions at `maxVisible={8}` render eight
	 * chips and `+1`, never nine.
	 * @default 8
	 */
	maxVisible?: number;
	/**
	 * Composes each chip's accessible name from the (already merged and
	 * floored) reaction. Defaults to English — `"thumbs up, 3 reactions"` —
	 * so pass your own to localise, including its plural rules.
	 *
	 * Deliberately says nothing about reacted-by-me: that rides on
	 * `aria-pressed`, and repeating it here would have screen readers announce
	 * the state twice.
	 */
	formatChipLabel?: (reaction: ReactionSummary) => string;
	/**
	 * Composes the overflow chip's accessible name. Defaults to English —
	 * `"2 more reactions"`. The visible `+2` stays as it is.
	 */
	formatOverflowLabel?: (hiddenCount: number) => string;
	/**
	 * Fires when the overflow chip is activated. Omit it and the chip renders
	 * inert: what "show all" means — expanding the row, opening a sheet — is
	 * the consumer's, and a button that does nothing takes a tab stop to
	 * promise an action that never happens.
	 */
	onShowAll?: () => void;
	/**
	 * Slot for an add-reaction control, rendered after the chips — normally a
	 * `<ReactionQuickSetPopover />`. Kept a slot rather than a built-in so
	 * either component can be used without the other.
	 */
	addAction?: ReactNode;
	/**
	 * Disables the chips this component owns, for a read-only or archived
	 * conversation. Anything passed as `addAction` is the consumer's to
	 * disable alongside it.
	 * @default false
	 */
	disabled?: boolean;
	/**
	 * Accessible name for the row as a whole.
	 * @default "Reactions"
	 */
	label?: string;
}

/** One emoji in the quick set, with the name assistive tech announces. */
export interface ReactionOption {
	/** The emoji glyph, e.g. `"👍"`. */
	emoji: string;
	/**
	 * The emoji's human name, e.g. `"thumbs up"` — the option's whole
	 * accessible name, since a bare glyph is announced inconsistently (or not
	 * at all). Required here, unlike on `ReactionSummary`: a picker offers
	 * emoji the viewer has not chosen yet, so there is no context to fall back
	 * on. Pass a translated set to localise.
	 */
	label: string;
}

export interface ReactionQuickSetPopoverProps {
	/** Fires with the emoji the viewer picked. The popover then closes itself. */
	onSelect: (emoji: string) => void;
	/**
	 * The emoji on offer. Kept short on purpose — a quick set is scanned, not
	 * searched; the full searchable picker is a separate, optional v2 surface.
	 * @default DEFAULT_REACTION_QUICK_SET (16 emoji)
	 */
	options?: readonly ReactionOption[];
	/**
	 * The control that opens the set. Defaults to a ghost icon button named by
	 * `label` — pass your own to match a surrounding toolbar.
	 */
	trigger?: ReactNode;
	/**
	 * Accessible name for the default trigger and for the grid itself.
	 * @default "Add reaction"
	 */
	label?: string;
	/**
	 * Controlled open state. Leave it unset and the popover manages its own —
	 * anker holds no state of yours either way.
	 */
	open?: boolean;
	/** Fires whenever the popover wants to open or close. */
	onOpenChange?: (open: boolean) => void;
	/**
	 * Disables the default trigger, for a read-only or archived conversation.
	 * A caller-supplied `trigger` is theirs to disable.
	 * @default false
	 */
	disabled?: boolean;
}
