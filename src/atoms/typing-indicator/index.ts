// `summarizeTypists` / `defaultTypingLabel` stay internal, the way
// unread-badge keeps `formatUnreadCount` internal: `TypistSummary` is public
// only because it is `formatLabel`'s argument.
export type { TypistSummary } from "./summarize-typists";
export {
	TypingIndicator,
	type TypingIndicatorProps,
} from "./typing-indicator";
