import { Input, InputGroup, Kbd } from "@chakra-ui/react";
import debounce from "lodash.debounce";
import { Search, X } from "lucide-react";
import type React from "react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { IconButton } from "../atoms/button";
import { Flex } from "../primitives/layout";
import { Tooltip } from "../primitives/tooltip";

export interface IconSearchHandle {
	/**
	 * Empty the input, cancel any pending debounced flush, emit onSearch(""),
	 * and close back to the icon button.
	 */
	clear: () => void;
	/** Open the search (if closed) and focus its input. */
	focus: () => void;
}

export interface IconSearchProps {
	/** Called with the search query after debounce, and with "" at once on clear. */
	onSearch: (query: string) => void;
	/**
	 * Accessible name of the icon button and of the input. Required with no
	 * default: only the call site knows what is searched ("Search the tree").
	 */
	label: string;
	/** Tooltip on the icon button. @default label */
	tooltip?: React.ReactNode;
	/**
	 * A single key that opens the search from anywhere on the page (e.g. "/"),
	 * matched against `KeyboardEvent.key`. Ignored while focus is in an
	 * editable element or a modifier is held. Shown in the tooltip.
	 */
	shortcut?: string;
	/** Debounce delay in milliseconds. @default 300 */
	debounceMs?: number;
	/** Placeholder text. @default "Search..." */
	placeholder?: string;
	/** Accessible name of the clear button. @default "Clear search" */
	clearLabel?: string;
	/** Controlled query. Pair with `onValueChange`. */
	value?: string;
	/** Initial query when uncontrolled. A non-empty one starts open. */
	defaultValue?: string;
	/** Called on every keystroke and with "" on clear (not debounced). */
	onValueChange?: (value: string) => void;
	/**
	 * Rendered next to the open input: a match count, previous/next buttons.
	 * Not shown while closed.
	 */
	counter?: React.ReactNode;
	/** Width of the open input. @default "15rem" */
	inputWidth?: string;
	/** Size of the icon button and the input. @default "sm" */
	size?: "xs" | "sm" | "md";
	/** @default false */
	disabled?: boolean;
}

function isEditable(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	const tag = target.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * A search that rests as an icon button and opens in place into an input.
 * The same contract as `SearchInput` (debounced `onSearch`, controlled or
 * uncontrolled, a `clear()`/`focus()` handle) for a place too tight for a
 * standing input — a label row, a toolbar's end.
 */
export const IconSearch = forwardRef<IconSearchHandle, IconSearchProps>(
	function IconSearch(props, ref) {
		const {
			onSearch,
			label,
			tooltip,
			shortcut,
			debounceMs = 300,
			placeholder = "Search...",
			clearLabel = "Clear search",
			value: controlledValue,
			defaultValue = "",
			onValueChange,
			counter,
			inputWidth = "15rem",
			size = "sm",
			disabled = false,
		} = props;

		const isControlled = controlledValue !== undefined;
		const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
		const value = isControlled ? controlledValue : uncontrolledValue;

		// A query keeps the search open whatever `opened` says, so a query is
		// never hidden behind the icon (and blur can never lose one).
		const [opened, setOpened] = useState(false);
		const isOpen = opened || value !== "";

		const rootRef = useRef<HTMLDivElement>(null);
		const inputRef = useRef<HTMLInputElement>(null);
		const buttonRef = useRef<HTMLButtonElement>(null);
		// Set by whatever opens the search for the person (click, shortcut,
		// focus()), so the effect below moves focus only then — never when a
		// controlled value opens it from outside.
		const focusOnOpen = useRef(false);
		// Set by Escape and the clear button, which close from inside: focus
		// goes back to the icon button rather than to the document body.
		const focusButtonOnClose = useRef(false);

		// The latest onSearch, read when the debounce fires. Rebuilding the
		// debounce on a new onSearch would cancel the pending call, and an inline
		// onSearch is new on every render — in controlled mode, every keystroke.
		const onSearchRef = useRef(onSearch);
		onSearchRef.current = onSearch;

		const debouncedSearch = useMemo(
			() => debounce((term: string) => onSearchRef.current(term), debounceMs),
			[debounceMs],
		);

		useEffect(() => {
			return () => {
				debouncedSearch.cancel();
			};
		}, [debouncedSearch]);

		useEffect(() => {
			if (isOpen && focusOnOpen.current) {
				focusOnOpen.current = false;
				inputRef.current?.focus();
			}
			if (!isOpen && focusButtonOnClose.current) {
				focusButtonOnClose.current = false;
				// Only focus the input took with it when it unmounted. The flag can
				// be stale — a controlled parent that kept its query on Escape, and
				// emptied it later from its own control, keeps that control's focus.
				const active = document.activeElement;
				if (!active || active === document.body) buttonRef.current?.focus();
			}
		}, [isOpen]);

		const setValue = useCallback(
			(next: string) => {
				if (!isControlled) setUncontrolledValue(next);
				onValueChange?.(next);
			},
			[isControlled, onValueChange],
		);

		const open = useCallback(() => {
			if (inputRef.current) {
				inputRef.current.focus();
				return;
			}
			focusOnOpen.current = true;
			setOpened(true);
		}, []);

		const clearAndClose = useCallback(
			(returnFocus: boolean) => {
				debouncedSearch.cancel();
				focusButtonOnClose.current = returnFocus;
				setValue("");
				setOpened(false);
				onSearchRef.current("");
			},
			[debouncedSearch, setValue],
		);

		useImperativeHandle(
			ref,
			() => ({
				clear: () => clearAndClose(false),
				focus: open,
			}),
			[clearAndClose, open],
		);

		useEffect(() => {
			if (!shortcut || disabled) return;
			const onKeyDown = (e: KeyboardEvent) => {
				if (e.defaultPrevented || e.key !== shortcut) return;
				if (e.ctrlKey || e.metaKey || e.altKey) return;
				if (isEditable(e.target)) return;
				e.preventDefault();
				open();
			};
			document.addEventListener("keydown", onKeyDown);
			return () => document.removeEventListener("keydown", onKeyDown);
		}, [shortcut, disabled, open]);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setValue(e.target.value);
			debouncedSearch(e.target.value);
		};

		const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key !== "Escape") return;
			// Handled here, so a dialog around the search does not close too.
			e.preventDefault();
			e.stopPropagation();
			clearAndClose(true);
		};

		// Blur closes only an empty search; with a query, isOpen stays true.
		const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
			const next = e.relatedTarget as Node | null;
			if (next && rootRef.current?.contains(next)) return;
			setOpened(false);
		};

		const iconSize = size === "md" ? 16 : 14;

		return (
			<Flex
				ref={rootRef}
				data-scope="icon-search"
				data-state={isOpen ? "open" : "closed"}
				display="inline-flex"
				alignItems="center"
				gap="1"
				// Pushed to the inline end of a flex row, the search grows towards
				// the inline start as it opens: leftwards from a label row's end.
				marginInlineStart="auto"
				flexShrink={0}
				maxWidth="full"
				onBlur={handleBlur}
			>
				{isOpen ? (
					<>
						<InputGroup
							width={inputWidth}
							maxWidth="full"
							startElement={<Search size={iconSize} aria-hidden />}
							endElement={
								<IconButton
									aria-label={clearLabel}
									variant="ghost"
									colorPalette="gray"
									size="2xs"
									onClick={() => clearAndClose(true)}
								>
									<X size={iconSize} />
								</IconButton>
							}
							endElementProps={{ paddingInlineEnd: "1" }}
						>
							<Input
								ref={inputRef}
								variant="outline"
								size={size}
								type="text"
								role="searchbox"
								autoComplete="off"
								aria-label={label}
								placeholder={placeholder}
								value={value}
								disabled={disabled}
								onChange={handleChange}
								onKeyDown={handleKeyDown}
								// Re-arm on focus: a search left open by its query and then
								// emptied while focused must not unmount under the caret.
								onFocus={() => setOpened(true)}
							/>
						</InputGroup>
						{counter != null && (
							<Flex alignItems="center" gap="1" flexShrink={0}>
								{counter}
							</Flex>
						)}
					</>
				) : (
					<Tooltip
						content={
							<>
								{tooltip ?? label}
								{shortcut && (
									<Kbd size="sm" marginInlineStart="2">
										{shortcut}
									</Kbd>
								)}
							</>
						}
						disabled={disabled}
					>
						<IconButton
							ref={buttonRef}
							aria-label={label}
							aria-keyshortcuts={shortcut}
							variant="ghost"
							colorPalette="gray"
							size={size}
							disabled={disabled}
							onClick={open}
							position="relative"
							// The visual button stays dense; the hit area is 44px.
							_before={{
								content: '""',
								position: "absolute",
								inset: "min(0px, calc((100% - 44px) / 2))",
							}}
						>
							<Search size={iconSize} />
						</IconButton>
					</Tooltip>
				)}
			</Flex>
		);
	},
);
IconSearch.displayName = "IconSearch";
