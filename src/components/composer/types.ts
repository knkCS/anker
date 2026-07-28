import type React from "react";

export interface ComposerMentionState {
	/** The query text between the trigger and the caret at selection time. */
	query: string;
}

export interface ComposerMentionProps<T> {
	/** Character that opens the dropdown at a word boundary. @default "@" */
	trigger?: string;
	/**
	 * Injected suggestion source: called with the current query; the dropdown
	 * renders whatever items it returns (sync or async). anker never fetches.
	 * An empty result closes the dropdown.
	 */
	getSuggestions: (query: string) => readonly T[] | Promise<readonly T[]>;
	/** Stable unique key per suggestion. */
	getSuggestionKey: (item: T) => string;
	/** Renders one suggestion row — the opaque item slot. */
	renderSuggestion: (item: T) => React.ReactNode;
	/**
	 * Selection callback. Return the text that replaces the mention token
	 * (trigger + query) — include the trigger and any trailing space yourself,
	 * e.g. `@Ada Lovelace `. Return nothing to leave the input unchanged
	 * (fully consumer-owned insertion via a controlled `value`).
	 */
	onSelect: (
		item: T,
		mention: ComposerMentionState,
		// biome-ignore lint/suspicious/noConfusingVoidType: void keeps notify-only consumer callbacks (that return nothing) assignable
	) => string | void;
	/** Accessible label for the suggestion listbox. @default "Mention suggestions" */
	"aria-label"?: string;
}

export interface ComposerProps<T = unknown> {
	/** Controlled input value. */
	value?: string;
	/** Uncontrolled initial value. */
	defaultValue?: string;
	/** Fires with the new value on every input change (and on clear-on-submit). */
	onValueChange?: (value: string) => void;
	/**
	 * Input-activity callback: fires on each user keystroke/change. Consumers
	 * throttle it and wire typing signals — anker never does.
	 */
	onInputActivity?: () => void;
	/**
	 * Submit callback. Fires on Enter (when `submitOnEnter`) or the send
	 * button; never with blank text. Uncontrolled composers clear afterwards;
	 * controlled consumers own the reset.
	 */
	onSubmit?: (value: string) => void;
	/** Pressing Enter submits; Shift+Enter inserts a newline. @default true */
	submitOnEnter?: boolean;
	/** Disables input and submit — for archived/read-only conversations. */
	disabled?: boolean;
	/** @default "Write a message…" */
	placeholder?: string;
	/** Accessible label for the send button. @default "Send message" */
	submitLabel?: string;
	/** Accessible label for the textarea. @default "Message" */
	"aria-label"?: string;
	/** Focus the textarea on mount. @default false */
	autoFocus?: boolean;
	/** Mention-autocomplete configuration. Omit to disable mentions. */
	mention?: ComposerMentionProps<T>;
}
