import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	IconSearch,
	type IconSearchHandle,
	type IconSearchProps,
} from "./icon-search";

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
});

function renderSearch(props: Partial<IconSearchProps> = {}) {
	const ref = createRef<IconSearchHandle>();
	const onSearch = props.onSearch ?? vi.fn();
	const utils = render(
		<ChakraProvider value={defaultSystem}>
			<IconSearch
				ref={ref}
				label="Search the tree"
				{...props}
				onSearch={onSearch}
			/>
			<button type="button">elsewhere</button>
		</ChakraProvider>,
	);
	return { ref, onSearch, ...utils };
}

const button = () => screen.getByRole("button", { name: "Search the tree" });
const input = () =>
	screen.getByRole("searchbox", {
		name: "Search the tree",
	}) as HTMLInputElement;
const queryInput = () => screen.queryByRole("searchbox");

describe("IconSearch — at rest", () => {
	it("renders an icon button with the accessible name, and no input", () => {
		renderSearch();
		expect(button()).toBeInTheDocument();
		expect(queryInput()).toBeNull();
	});

	it("names the shortcut on the button for assistive tech", () => {
		renderSearch({ shortcut: "/" });
		expect(button()).toHaveAttribute("aria-keyshortcuts", "/");
	});
});

describe("IconSearch — opening", () => {
	it("a click opens it with focus in the input", () => {
		renderSearch();
		fireEvent.click(button());
		expect(input()).toHaveFocus();
		expect(
			screen.queryByRole("button", { name: "Search the tree" }),
		).toBeNull();
	});

	it("the shortcut key opens it with focus in the input", () => {
		renderSearch({ shortcut: "/" });
		const event = new KeyboardEvent("keydown", {
			key: "/",
			bubbles: true,
			cancelable: true,
		});
		act(() => {
			document.body.dispatchEvent(event);
		});
		expect(event.defaultPrevented).toBe(true);
		expect(input()).toHaveFocus();
	});

	it("ignores the shortcut while typing elsewhere or with a modifier", () => {
		render(
			<ChakraProvider value={defaultSystem}>
				<input aria-label="other" />
				<IconSearch label="Search the tree" shortcut="/" onSearch={() => {}} />
			</ChakraProvider>,
		);
		const other = screen.getByLabelText("other");
		fireEvent.keyDown(other, { key: "/" });
		fireEvent.keyDown(document.body, { key: "/", metaKey: true });
		expect(queryInput()).toBeNull();
	});

	it("a non-empty initial value starts open", () => {
		renderSearch({ defaultValue: "abc" });
		expect(input().value).toBe("abc");
	});
});

describe("IconSearch — closing", () => {
	it("Escape empties and closes it, emits onSearch('') and returns focus", () => {
		const { onSearch } = renderSearch();
		fireEvent.click(button());
		fireEvent.change(input(), { target: { value: "abc" } });
		fireEvent.keyDown(input(), { key: "Escape" });
		expect(queryInput()).toBeNull();
		expect(onSearch).toHaveBeenCalledTimes(1);
		expect(onSearch).toHaveBeenCalledWith("");
		expect(button()).toHaveFocus();
		// The pending "abc" flush was cancelled.
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(onSearch).toHaveBeenCalledTimes(1);
	});

	it("does not let Escape reach an enclosing handler", () => {
		const outer = vi.fn();
		render(
			// biome-ignore lint/a11y/noStaticElementInteractions: test harness
			<div onKeyDown={outer}>
				<ChakraProvider value={defaultSystem}>
					<IconSearch label="Search the tree" onSearch={() => {}} />
				</ChakraProvider>
			</div>,
		);
		fireEvent.click(button());
		fireEvent.keyDown(input(), { key: "Escape" });
		expect(outer).not.toHaveBeenCalled();
	});

	it("the clear button empties and closes it and emits onSearch('')", () => {
		const { onSearch } = renderSearch({ clearLabel: "Clear it" });
		fireEvent.click(button());
		fireEvent.change(input(), { target: { value: "abc" } });
		fireEvent.click(screen.getByRole("button", { name: "Clear it" }));
		expect(queryInput()).toBeNull();
		expect(onSearch).toHaveBeenCalledWith("");
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(onSearch).toHaveBeenCalledTimes(1);
	});

	it("blur closes it while empty", () => {
		renderSearch();
		fireEvent.click(button());
		fireEvent.blur(input(), {
			relatedTarget: screen.getByRole("button", { name: "elsewhere" }),
		});
		expect(queryInput()).toBeNull();
	});

	it("blur keeps it open with a query", () => {
		renderSearch();
		fireEvent.click(button());
		fireEvent.change(input(), { target: { value: "abc" } });
		fireEvent.blur(input(), {
			relatedTarget: screen.getByRole("button", { name: "elsewhere" }),
		});
		expect(input().value).toBe("abc");
	});

	it("stays open when a query kept open by blur is emptied after refocusing", () => {
		renderSearch();
		fireEvent.click(button());
		fireEvent.change(input(), { target: { value: "abc" } });
		fireEvent.blur(input(), {
			relatedTarget: screen.getByRole("button", { name: "elsewhere" }),
		});
		fireEvent.focus(input());
		fireEvent.change(input(), { target: { value: "" } });
		expect(input()).toBeInTheDocument();
	});

	it("moving focus to the counter keeps an empty search open", () => {
		renderSearch({ counter: <button type="button">Next match</button> });
		fireEvent.click(button());
		fireEvent.blur(input(), {
			relatedTarget: screen.getByRole("button", { name: "Next match" }),
		});
		expect(input()).toBeInTheDocument();
	});
});

describe("IconSearch — the SearchInput contract", () => {
	it("debounces onSearch", () => {
		const { onSearch } = renderSearch({ debounceMs: 200 });
		fireEvent.click(button());
		fireEvent.change(input(), { target: { value: "a" } });
		fireEvent.change(input(), { target: { value: "ab" } });
		act(() => {
			vi.advanceTimersByTime(199);
		});
		expect(onSearch).not.toHaveBeenCalled();
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(onSearch).toHaveBeenCalledTimes(1);
		expect(onSearch).toHaveBeenCalledWith("ab");
	});

	it("clear() empties and closes it, cancels the debounce, emits onSearch('')", () => {
		const { ref, onSearch } = renderSearch();
		fireEvent.click(button());
		fireEvent.change(input(), { target: { value: "abc" } });
		act(() => {
			ref.current?.clear();
		});
		expect(queryInput()).toBeNull();
		expect(onSearch).toHaveBeenCalledTimes(1);
		expect(onSearch).toHaveBeenCalledWith("");
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(onSearch).toHaveBeenCalledTimes(1);
	});

	it("focus() opens it and focuses the input", () => {
		const { ref } = renderSearch();
		act(() => {
			ref.current?.focus();
		});
		expect(input()).toHaveFocus();
	});

	it("works controlled", () => {
		const onSearch = vi.fn();
		const seen: string[] = [];
		function Controlled() {
			const [value, setValue] = useState("start");
			seen.push(value);
			return (
				<ChakraProvider value={defaultSystem}>
					<IconSearch
						label="Search the tree"
						value={value}
						onValueChange={(v) => setValue(v.toUpperCase())}
						onSearch={onSearch}
					/>
				</ChakraProvider>
			);
		}
		render(<Controlled />);
		// A controlled query opens it.
		expect(input().value).toBe("start");
		fireEvent.change(input(), { target: { value: "abc" } });
		expect(input().value).toBe("ABC");
		fireEvent.keyDown(input(), { key: "Escape" });
		expect(queryInput()).toBeNull();
		expect(seen.at(-1)).toBe("");
		expect(onSearch).toHaveBeenCalledWith("");
	});

	it("debounces onSearch controlled with an inline onSearch", () => {
		const calls: string[] = [];
		function Controlled() {
			const [value, setValue] = useState("");
			return (
				<ChakraProvider value={defaultSystem}>
					<IconSearch
						label="Search the tree"
						value={value}
						onValueChange={setValue}
						onSearch={(q) => calls.push(q)}
					/>
				</ChakraProvider>
			);
		}
		render(<Controlled />);
		fireEvent.click(button());
		fireEvent.change(input(), { target: { value: "a" } });
		fireEvent.change(input(), { target: { value: "ab" } });
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(calls).toEqual(["ab"]);
	});

	it("does not steal focus later when a controlled parent keeps its query on Escape", () => {
		function Stubborn() {
			const [value, setValue] = useState("kept");
			return (
				<ChakraProvider value={defaultSystem}>
					<IconSearch
						label="Search the tree"
						value={value}
						onValueChange={() => {}}
						onSearch={() => {}}
					/>
					<button type="button" onClick={() => setValue("")}>
						reset
					</button>
				</ChakraProvider>
			);
		}
		render(<Stubborn />);
		fireEvent.keyDown(input(), { key: "Escape" });
		// Still open: the parent ignored "".
		expect(input()).toBeInTheDocument();
		// Later the parent empties it from its own control, which keeps focus.
		const reset = screen.getByRole("button", { name: "reset" });
		act(() => reset.focus());
		fireEvent.click(reset);
		expect(queryInput()).toBeNull();
		expect(reset).toHaveFocus();
	});

	it("works uncontrolled, reporting each keystroke to onValueChange", () => {
		const onValueChange = vi.fn();
		renderSearch({ onValueChange });
		fireEvent.click(button());
		fireEvent.change(input(), { target: { value: "x" } });
		expect(input().value).toBe("x");
		expect(onValueChange).toHaveBeenCalledWith("x");
	});

	it("uses the placeholder passed in", () => {
		renderSearch({ placeholder: "Find…" });
		fireEvent.click(button());
		expect(input()).toHaveAttribute("placeholder", "Find…");
	});
});

describe("IconSearch — counter slot", () => {
	it("renders whatever it is given next to the open input", () => {
		renderSearch({
			defaultValue: "a",
			counter: <span data-testid="counter">3 of 12</span>,
		});
		const counter = screen.getByTestId("counter");
		expect(counter).toHaveTextContent("3 of 12");
		// Next to the input: the input precedes it in document order.
		expect(
			input().compareDocumentPosition(counter) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("is not shown while closed", () => {
		renderSearch({ counter: <span data-testid="counter">3 of 12</span> });
		expect(screen.queryByTestId("counter")).toBeNull();
	});
});
