// `partitionReactions` stays internal — the same line unread-badge draws
// around `formatUnreadCount` and typing-indicator around `summarizeTypists`.
// Only the types a consumer needs to build props are public.
export { DEFAULT_REACTION_QUICK_SET } from "./quick-set";
export { ReactionChips } from "./reaction-chips";
export { ReactionQuickSetPopover } from "./reaction-quick-set-popover";
export type {
	ReactionChipsProps,
	ReactionOption,
	ReactionQuickSetPopoverProps,
	ReactionSummary,
} from "./types";
