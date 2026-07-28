import { chakra, useSlotRecipe } from "@chakra-ui/react";
import { SendHorizontal } from "lucide-react";
import {
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import {
	type ActiveMention,
	applyMentionInsertion,
	getActiveMention,
	moveHighlight,
} from "./mention";
import type { ComposerProps } from "./types";

/**
 * Chat message input: auto-growing multiline textarea, send affordance with
 * submit-on-enter, disabled state, and an optional mention-autocomplete
 * dropdown. Presentation-only — suggestion data, typing signals, and message
 * sending are wired by the consumer through callbacks.
 */
export const Composer = <T,>(props: ComposerProps<T>) => {
	const {
		value: controlledValue,
		defaultValue = "",
		onValueChange,
		onInputActivity,
		onSubmit,
		submitOnEnter = true,
		disabled = false,
		placeholder = "Write a message…",
		submitLabel = "Send message",
		"aria-label": ariaLabel = "Message",
		autoFocus = false,
		mention,
	} = props;

	const recipe = useSlotRecipe({ key: "composer" });
	const styles = recipe();
	const listboxId = `${useId()}-mention-listbox`;

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const isControlled = controlledValue !== undefined;
	const [internalValue, setInternalValue] = useState(defaultValue);
	const value = isControlled ? controlledValue : internalValue;

	const setValue = useCallback(
		(next: string) => {
			if (!isControlled) setInternalValue(next);
			onValueChange?.(next);
		},
		[isControlled, onValueChange],
	);

	// Latest mention config in a ref so effects don't refire on the (usually
	// inline) config object's identity — same pattern as VirtualizedMessageList.
	const mentionRef = useRef(mention);
	useEffect(() => {
		mentionRef.current = mention;
	});

	const [active, setActive] = useState<ActiveMention | null>(null);
	const [suggestions, setSuggestions] = useState<readonly T[]>([]);
	const [highlightIndex, setHighlightIndex] = useState(0);
	// Escape (or a completed insertion) dismisses the dropdown for the rest of
	// the token it was open for; a mention starting elsewhere re-arms it.
	const [dismissedStart, setDismissedStart] = useState<number | null>(null);

	const updateActive = useCallback((el: HTMLTextAreaElement) => {
		const m = mentionRef.current;
		if (!m) return;
		const caret = el.selectionStart ?? el.value.length;
		setActive(getActiveMention(el.value, caret, m.trigger ?? "@"));
	}, []);

	useEffect(() => {
		if (dismissedStart !== null && active?.start !== dismissedStart) {
			setDismissedStart(null);
		}
	}, [active, dismissedStart]);

	const isDismissed = active !== null && active.start === dismissedStart;
	const activeQuery = active === null || isDismissed ? null : active.query;

	// Ask the injected callback for suggestions whenever the query changes;
	// a stale async result (superseded query) is dropped.
	const fetchSeqRef = useRef(0);
	useEffect(() => {
		const m = mentionRef.current;
		const seq = ++fetchSeqRef.current;
		if (!m || activeQuery === null) {
			setSuggestions([]);
			return;
		}
		const result = m.getSuggestions(activeQuery);
		if (result instanceof Promise) {
			result.then(
				(items) => {
					if (fetchSeqRef.current !== seq) return;
					setSuggestions(items);
					setHighlightIndex(0);
				},
				() => {
					if (fetchSeqRef.current !== seq) return;
					setSuggestions([]);
				},
			);
		} else {
			setSuggestions(result);
			setHighlightIndex(0);
		}
	}, [activeQuery]);

	const isOpen =
		!disabled && active !== null && !isDismissed && suggestions.length > 0;

	// Autogrow: track the content height up to the recipe's maxBlockSize cap.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `value` triggers a re-measure — el.scrollHeight reflects it only after render
	useLayoutEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.blockSize = "auto";
		el.style.blockSize = `${el.scrollHeight}px`;
	}, [value]);

	// Place the caret after an applied mention insertion, once the new value
	// has rendered.
	const pendingCaretRef = useRef<number | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: `value` gates the effect to the render where the DOM carries the post-insertion text
	useLayoutEffect(() => {
		const caret = pendingCaretRef.current;
		if (caret === null) return;
		pendingCaretRef.current = null;
		textareaRef.current?.setSelectionRange(caret, caret);
	}, [value]);

	const selectSuggestion = useCallback(
		(item: T) => {
			const m = mentionRef.current;
			if (!m || active === null) return;
			const trigger = m.trigger ?? "@";
			const insert = m.onSelect(item, { query: active.query });
			setDismissedStart(active.start);
			if (typeof insert === "string") {
				const applied = applyMentionInsertion(value, active, trigger, insert);
				setValue(applied.value);
				setActive(getActiveMention(applied.value, applied.caretIndex, trigger));
				pendingCaretRef.current = applied.caretIndex;
			}
			textareaRef.current?.focus();
		},
		[active, value, setValue],
	);

	const canSubmit = !disabled && value.trim() !== "";
	const submit = useCallback(() => {
		if (!canSubmit) return;
		onSubmit?.(value);
		if (!isControlled) {
			setValue("");
			setActive(null);
		}
	}, [canSubmit, onSubmit, value, isControlled, setValue]);

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement>) => {
			setValue(event.currentTarget.value);
			onInputActivity?.();
			updateActive(event.currentTarget);
		},
		[setValue, onInputActivity, updateActive],
	);

	const handleSelectionChange = useCallback(
		(event: React.SyntheticEvent<HTMLTextAreaElement>) => {
			updateActive(event.currentTarget);
		},
		[updateActive],
	);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.nativeEvent.isComposing) return;
			if (isOpen) {
				if (event.key === "ArrowDown" || event.key === "ArrowUp") {
					event.preventDefault();
					const delta = event.key === "ArrowDown" ? 1 : -1;
					setHighlightIndex((i) => moveHighlight(suggestions.length, i, delta));
					return;
				}
				if (event.key === "Enter" || event.key === "Tab") {
					event.preventDefault();
					const item = suggestions[highlightIndex];
					if (item !== undefined) selectSuggestion(item);
					return;
				}
				if (event.key === "Escape") {
					// Keep the Escape from also closing a surrounding drawer/modal.
					event.preventDefault();
					event.stopPropagation();
					if (active !== null) setDismissedStart(active.start);
					return;
				}
			}
			if (event.key === "Enter" && !event.shiftKey && submitOnEnter) {
				event.preventDefault();
				submit();
			}
		},
		[
			isOpen,
			suggestions,
			highlightIndex,
			selectSuggestion,
			active,
			submitOnEnter,
			submit,
		],
	);

	const optionId = (index: number) => `${listboxId}-option-${index}`;

	return (
		<chakra.div
			css={styles.root}
			className="composer"
			data-testid="composer"
			data-disabled={disabled ? "" : undefined}
		>
			{isOpen && mention ? (
				<chakra.div
					css={styles.dropdown}
					className="composer__dropdown"
					data-testid="composer-dropdown"
					role="listbox"
					id={listboxId}
					aria-label={mention["aria-label"] ?? "Mention suggestions"}
				>
					{suggestions.map((item, index) => (
						<chakra.div
							key={mention.getSuggestionKey(item)}
							css={styles.option}
							className="composer__option"
							data-testid="composer-option"
							id={optionId(index)}
							role="option"
							aria-selected={index === highlightIndex}
							data-highlighted={index === highlightIndex ? "" : undefined}
							// Keep focus in the textarea while clicking a suggestion.
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => selectSuggestion(item)}
							onMouseEnter={() => setHighlightIndex(index)}
						>
							{mention.renderSuggestion(item)}
						</chakra.div>
					))}
				</chakra.div>
			) : null}
			<chakra.textarea
				ref={textareaRef}
				css={styles.textarea}
				className="composer__textarea"
				data-testid="composer-textarea"
				rows={1}
				value={value}
				placeholder={placeholder}
				disabled={disabled}
				aria-label={ariaLabel}
				aria-autocomplete={mention ? "list" : undefined}
				aria-haspopup={mention ? "listbox" : undefined}
				aria-expanded={mention ? isOpen : undefined}
				aria-controls={isOpen ? listboxId : undefined}
				aria-activedescendant={
					isOpen && highlightIndex >= 0 ? optionId(highlightIndex) : undefined
				}
				autoFocus={autoFocus}
				onChange={handleChange}
				onSelect={handleSelectionChange}
				onKeyDown={handleKeyDown}
			/>
			<chakra.button
				type="button"
				css={styles.send}
				className="composer__send"
				data-testid="composer-send"
				aria-label={submitLabel}
				disabled={!canSubmit}
				onClick={submit}
			>
				<SendHorizontal size={18} aria-hidden />
			</chakra.button>
		</chakra.div>
	);
};
(Composer as { displayName?: string }).displayName = "Composer";
