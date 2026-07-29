import type { ReactionOption } from "./types";

/**
 * The curated quick set ReactionQuickSetPopover offers unless the consumer
 * passes its own: sixteen emoji that cover acknowledgement, agreement,
 * celebration and the common emotional replies in a work conversation.
 *
 * Sixteen is a deliberate ceiling, not a sample of a larger catalogue. A quick
 * set is meant to be scanned at a glance and hit without reading; past two
 * rows it stops being quicker than searching. The full searchable picker is
 * explicitly v2, behind an optional subpath (messengerhub ADR-0009) — nothing
 * here may pull in an emoji-data dependency.
 *
 * Labels are the English accessible names. A bare glyph is announced
 * inconsistently across screen readers (and sometimes not at all), so every
 * option carries one; pass a translated set to localise them.
 */
export const DEFAULT_REACTION_QUICK_SET: readonly ReactionOption[] = [
	{ emoji: "👍", label: "thumbs up" },
	{ emoji: "👎", label: "thumbs down" },
	{ emoji: "❤️", label: "heart" },
	{ emoji: "🎉", label: "party popper" },
	{ emoji: "😂", label: "laughing" },
	{ emoji: "😮", label: "surprised" },
	{ emoji: "😢", label: "sad" },
	{ emoji: "🙏", label: "thank you" },
	{ emoji: "🔥", label: "fire" },
	{ emoji: "👀", label: "eyes on it" },
	{ emoji: "✅", label: "done" },
	{ emoji: "❌", label: "no" },
	{ emoji: "🚀", label: "shipped" },
	{ emoji: "💡", label: "good idea" },
	{ emoji: "⚠️", label: "warning" },
	{ emoji: "🤔", label: "thinking" },
];
