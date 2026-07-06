import { Input, InputGroup, type InputProps } from "@chakra-ui/react";
import debounce from "lodash.debounce";
import { Search } from "lucide-react";
import type React from "react";
import {
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
} from "react";

export interface SearchInputHandle {
	/** Empty the input, cancel any pending debounced flush, and emit onSearch(""). */
	clear: () => void;
	/** Focus the underlying input element. */
	focus: () => void;
}

export interface SearchInputProps
	extends Omit<InputProps, "onChange" | "defaultValue" | "ref"> {
	/** Imperative handle for programmatic clear/focus (React 19 ref-as-prop). */
	ref?: React.Ref<SearchInputHandle>;
	/** Called with the search query after debounce. */
	onSearch: (query: string) => void;
	/** Debounce delay in milliseconds. @default 300 */
	debounceMs?: number;
	/** Placeholder text. @default "Search..." */
	placeholder?: string;
	/** Initial value. */
	defaultValue?: string;
	maxWidth?: string;
}

export const SearchInput: React.FC<SearchInputProps> = (props) => {
	const {
		ref,
		onSearch,
		debounceMs = 300,
		placeholder = "Search...",
		defaultValue = "",
		maxWidth = "full",
		...restProps
	} = props;

	const inputRef = useRef<HTMLInputElement>(null);

	const debouncedSearch = useMemo(
		() => debounce((term: string) => onSearch(term), debounceMs),
		[onSearch, debounceMs],
	);

	useEffect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	}, [debouncedSearch]);

	useImperativeHandle(
		ref,
		() => ({
			clear: () => {
				if (inputRef.current) inputRef.current.value = "";
				debouncedSearch.cancel();
				onSearch("");
			},
			focus: () => inputRef.current?.focus(),
		}),
		[debouncedSearch, onSearch],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			debouncedSearch(e.target.value);
		},
		[debouncedSearch],
	);

	return (
		<InputGroup maxWidth={maxWidth} startElement={<Search size={16} />}>
			<Input
				variant="outline"
				type="text"
				autoComplete="off"
				placeholder={placeholder}
				defaultValue={defaultValue}
				onChange={handleChange}
				ref={inputRef}
				{...restProps}
			/>
		</InputGroup>
	);
};
SearchInput.displayName = "SearchInput";
