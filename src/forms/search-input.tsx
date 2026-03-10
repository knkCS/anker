import { Input, InputGroup, type InputProps } from "@chakra-ui/react";
import debounce from "lodash.debounce";
import { Search } from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";

export interface SearchInputProps
	extends Omit<InputProps, "onChange" | "defaultValue"> {
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
		onSearch,
		debounceMs = 300,
		placeholder = "Search...",
		defaultValue = "",
		maxWidth = "full",
		...restProps
	} = props;

	const debouncedSearch = useMemo(
		() => debounce((term: string) => onSearch(term), debounceMs),
		[onSearch, debounceMs],
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
				{...restProps}
			/>
		</InputGroup>
	);
};
