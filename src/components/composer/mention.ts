export interface ActiveMention {
	/** Index of the trigger character in the value. */
	start: number;
	/** Text between the trigger and the caret. */
	query: string;
}

/**
 * The mention token at the caret, or null when the caret is not inside one.
 * The trigger only counts at a word boundary (start of value or after
 * whitespace), so emails like "a@b" never open the dropdown.
 */
const MAX_QUERY_LENGTH = 64;

/**
 * Next highlighted index for keyboard navigation, wrapping at both ends.
 * Returns -1 when there are no suggestions.
 */
export function moveHighlight(
	count: number,
	current: number,
	delta: number,
): number {
	if (count === 0) return -1;
	return (current + delta + count) % count;
}

/**
 * Replaces the mention token (trigger + query) with the consumer's insert
 * text — verbatim: include the trigger and any trailing space in insertText.
 * Returns the new value and the caret index just after the insert.
 */
export function applyMentionInsertion(
	value: string,
	mention: ActiveMention,
	trigger: string,
	insertText: string,
): { value: string; caretIndex: number } {
	const tokenEnd = mention.start + trigger.length + mention.query.length;
	return {
		value: value.slice(0, mention.start) + insertText + value.slice(tokenEnd),
		caretIndex: mention.start + insertText.length,
	};
}

export function getActiveMention(
	value: string,
	caretIndex: number,
	trigger: string,
): ActiveMention | null {
	const start = value.lastIndexOf(trigger, caretIndex - 1);
	if (start === -1) return null;
	if (start > 0 && !/\s/.test(value[start - 1])) return null;
	const query = value.slice(start + trigger.length, caretIndex);
	if (query.includes("\n")) return null;
	if (/^\s/.test(query)) return null;
	if (query.length > MAX_QUERY_LENGTH) return null;
	return { start, query };
}
