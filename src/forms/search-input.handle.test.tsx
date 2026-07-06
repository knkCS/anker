import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchInput, type SearchInputHandle } from "./search-input";

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
});

function renderWithHandle(onSearch: (q: string) => void) {
	const ref = createRef<SearchInputHandle>();
	render(
		<ChakraProvider value={defaultSystem}>
			<SearchInput ref={ref} onSearch={onSearch} placeholder="Search…" />
		</ChakraProvider>,
	);
	return ref;
}

describe("SearchInput — ref handle", () => {
	it("clear() empties the input, cancels the pending debounce, and emits onSearch('') once", () => {
		const onSearch = vi.fn();
		const ref = renderWithHandle(onSearch);
		const input = screen.getByPlaceholderText("Search…") as HTMLInputElement;

		fireEvent.change(input, { target: { value: "abc" } });
		// Debounce (300ms) has not fired yet.
		expect(onSearch).not.toHaveBeenCalled();

		act(() => {
			ref.current?.clear();
		});
		expect(input.value).toBe("");
		expect(onSearch).toHaveBeenCalledTimes(1);
		expect(onSearch).toHaveBeenCalledWith("");

		// The pending "abc" flush must have been cancelled.
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(onSearch).toHaveBeenCalledTimes(1);
	});

	it("focus() focuses the input", () => {
		const ref = renderWithHandle(() => {});
		act(() => {
			ref.current?.focus();
		});
		expect(screen.getByPlaceholderText("Search…")).toHaveFocus();
	});
});
