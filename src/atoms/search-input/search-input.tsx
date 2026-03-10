import { Input, InputGroup, type InputProps } from "@chakra-ui/react";
import debounce from "lodash.debounce";
import { Search } from "lucide-react";
import type React from "react";
import { useRef } from "react";

export interface SearchInputProps
	extends Omit<InputProps, "onChange" | "defaultValue"> {
	onChange: (term: string) => void;
	maxWidth?: string;
}

export const SearchInput: React.FC<SearchInputProps> = (props) => {
	const { value, onChange, maxWidth = "full", ...restProps } = props;

	const debouncedSearch = useRef(
		debounce((term: string) => {
			onChange(term);
		}, 300),
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		debouncedSearch.current(e.target.value);
	};

	return (
		<InputGroup maxWidth={maxWidth} startElement={<Search size={16} />}>
			<Input
				bgColor="gray.50"
				variant="outline"
				type="text"
				autoComplete="off"
				defaultValue={String(value || "")}
				onChange={handleChange}
				{...restProps}
			/>
		</InputGroup>
	);
};
