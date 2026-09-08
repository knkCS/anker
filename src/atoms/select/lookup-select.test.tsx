import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { BaseSelect } from "./base-select";
import {
	type LookupPage,
	type LookupResolveArgs,
	type LookupSearchArgs,
	LookupSelect,
} from "./lookup-select";
import type { BaseOption } from "./types";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

const ada: BaseOption = {
	id: "u1",
	label: "Ada Lovelace",
	avatar: "Ada Lovelace",
};
const grace: BaseOption = { id: "u2", label: "Grace Hopper" };
const alan: BaseOption = { id: "u3", label: "Alan Turing" };

/** A Source that answers everything from one in-memory table. */
function tableSource(table: BaseOption[] = [ada, grace, alan]) {
	return vi.fn(
		async ({ query }: LookupSearchArgs): Promise<LookupPage<BaseOption>> => ({
			items: table.filter((o) =>
				o.label.toLowerCase().includes(query.toLowerCase()),
			),
		}),
	);
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

/** jsdom reports every box as 0×0; state the geometry the scroll implies. */
function setScrollGeometry(
	el: HTMLElement,
	geometry: { scrollTop: number; scrollHeight: number; clientHeight: number },
) {
	for (const [key, value] of Object.entries(geometry)) {
		Object.defineProperty(el, key, { value, configurable: true });
	}
}

/** A wait long enough for a debounce plus a microtask flush to have happened. */
const settle = () => new Promise((r) => setTimeout(r, 60));

const queriesSeen = (search: ReturnType<typeof tableSource>) =>
	search.mock.calls.map((call) => call[0].query);

describe("LookupSelect — the Source", () => {
	it("does not call the Source until the menu opens", async () => {
		const user = userEvent.setup();
		const search = tableSource();

		renderWithChakra(
			<LookupSelect value={null} search={search} placeholder="Pick a person" />,
		);

		expect(await screen.findByText("Pick a person")).toBeInTheDocument();
		await settle();
		expect(search).not.toHaveBeenCalled();

		await user.click(screen.getByRole("combobox"));

		expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
		expect(search).toHaveBeenCalledTimes(1);
		expect(search.mock.calls[0][0].query).toBe("");
	});

	it("debounces typing into a single request for the final query", async () => {
		const user = userEvent.setup();
		const search = tableSource();

		renderWithChakra(
			<LookupSelect value={null} search={search} debounceMs={50} />,
		);

		await user.click(screen.getByRole("combobox"));
		await screen.findByText("Ada Lovelace");

		await user.type(screen.getByRole("combobox"), "gra");

		await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
		await settle();

		expect(queriesSeen(search)).toEqual(["", "gra"]);
		expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
	});

	it("cancels the superseded request and never lets its late answer win", async () => {
		const user = userEvent.setup();
		const first = deferred<LookupPage<BaseOption>>();
		const second = deferred<LookupPage<BaseOption>>();
		const signals: AbortSignal[] = [];
		let call = 0;
		const search = vi.fn(async ({ signal }: LookupSearchArgs) => {
			signals.push(signal);
			call += 1;
			if (call === 1) return { items: [] };
			return call === 2 ? first.promise : second.promise;
		});

		renderWithChakra(
			<LookupSelect value={null} search={search} debounceMs={10} />,
		);

		await user.click(screen.getByRole("combobox"));
		await waitFor(() => expect(search).toHaveBeenCalledTimes(1));

		await user.type(screen.getByRole("combobox"), "a");
		await waitFor(() => expect(search).toHaveBeenCalledTimes(2));

		await user.type(screen.getByRole("combobox"), "b");
		await waitFor(() => expect(search).toHaveBeenCalledTimes(3));

		// The still-open first query was abandoned the moment the second began.
		expect(signals[1].aborted).toBe(true);

		second.resolve({ items: [grace] });
		expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();

		first.resolve({ items: [alan] });
		await settle();

		expect(screen.queryByText("Alan Turing")).toBeNull();
		expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
	});

	it("pages on scroll to the bottom and accumulates what it has", async () => {
		const user = userEvent.setup();
		const search = vi.fn(
			async ({ cursor }: LookupSearchArgs): Promise<LookupPage<BaseOption>> =>
				cursor === "p2"
					? { items: [alan] }
					: { items: [ada, grace], nextCursor: "p2" },
		);

		renderWithChakra(
			<LookupSelect value={null} search={search} debounceMs={10} />,
		);

		await user.click(screen.getByRole("combobox"));
		expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();

		const listbox = screen.getByRole("listbox");

		setScrollGeometry(listbox, {
			scrollTop: 0,
			scrollHeight: 400,
			clientHeight: 100,
		});
		fireEvent.scroll(listbox);
		await settle();
		expect(search).toHaveBeenCalledTimes(1);

		setScrollGeometry(listbox, {
			scrollTop: 300,
			scrollHeight: 400,
			clientHeight: 100,
		});
		fireEvent.scroll(listbox);

		expect(await screen.findByText("Alan Turing")).toBeInTheDocument();
		expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
		expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
		expect(search).toHaveBeenCalledTimes(2);
		expect(search.mock.calls[1][0].cursor).toBe("p2");

		// The last page carried no cursor, so the bottom is the bottom.
		fireEvent.scroll(listbox);
		await settle();
		expect(search).toHaveBeenCalledTimes(2);
	});

	it("surfaces a Source failure without losing the control", async () => {
		const user = userEvent.setup();
		let failing = true;
		const search = vi.fn(async (): Promise<LookupPage<BaseOption>> => {
			if (failing) throw new Error("upstream is down");
			return { items: [ada] };
		});

		renderWithChakra(
			<LookupSelect value={null} search={search} debounceMs={10} />,
		);

		await user.click(screen.getByRole("combobox"));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Could not load options",
		);

		failing = false;
		await user.type(screen.getByRole("combobox"), "ada");

		expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
		expect(screen.queryByRole("alert")).toBeNull();
	});
});

describe("LookupSelect — the value", () => {
	it("trusts a full item and never asks anyone about it", async () => {
		const search = tableSource();
		const resolve = vi.fn(async () => []);

		renderWithChakra(
			<LookupSelect value={grace} search={search} resolve={resolve} />,
		);

		expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
		expect(search).not.toHaveBeenCalled();
		expect(resolve).not.toHaveBeenCalled();
	});

	it("resolves a stored id into a readable label", async () => {
		const search = tableSource();
		const resolve = vi.fn(async ({ ids }: LookupResolveArgs) =>
			ids.map((id) => ({ id, label: "Grace Hopper" })),
		);

		renderWithChakra(
			<LookupSelect value="u2" search={search} resolve={resolve} />,
		);

		expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
		expect(resolve.mock.calls[0][0].ids).toEqual(["u2"]);
		// Resolving a stored id is not searching — the Source stays untouched.
		expect(search).not.toHaveBeenCalled();
	});

	it("falls back to the just-picked label when there is no resolver", async () => {
		const user = userEvent.setup();
		const search = tableSource();

		function Harness() {
			// The consumer stores only the id, as a form value would.
			const [id, setId] = useState<string | null>(null);
			return (
				<LookupSelect
					value={id}
					search={search}
					debounceMs={10}
					onChange={(next) => setId((next as BaseOption | null)?.id ?? null)}
				/>
			);
		}

		renderWithChakra(<Harness />);

		await user.click(screen.getByRole("combobox"));
		await user.click(await screen.findByText("Ada Lovelace"));

		expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
		expect(screen.queryByText("u1")).toBeNull();
	});

	it("falls back to the raw id when there is neither", async () => {
		const search = tableSource();

		renderWithChakra(<LookupSelect value="u9" search={search} />);

		expect(await screen.findByText("u9")).toBeInTheDocument();
	});

	it("emits the picked item", async () => {
		const user = userEvent.setup();
		const search = tableSource();
		const onChange = vi.fn();

		renderWithChakra(
			<LookupSelect
				value={null}
				search={search}
				debounceMs={10}
				onChange={onChange}
			/>,
		);

		await user.click(screen.getByRole("combobox"));
		await user.click(await screen.findByText("Grace Hopper"));

		expect(onChange).toHaveBeenCalledWith(grace);
	});

	it("supports multi-selection", async () => {
		const user = userEvent.setup();
		const search = tableSource();
		const onChange = vi.fn();

		function Harness() {
			const [ids, setIds] = useState<string[]>([]);
			return (
				<LookupSelect
					isMulti
					value={ids}
					search={search}
					debounceMs={10}
					onChange={(next) => {
						const items = next as BaseOption[];
						onChange(items);
						setIds(items.map((item) => item.id));
					}}
				/>
			);
		}

		renderWithChakra(<Harness />);

		await user.click(screen.getByRole("combobox"));
		await user.click(await screen.findByText("Ada Lovelace"));

		await user.click(screen.getByRole("combobox"));
		await user.click(await screen.findByText("Grace Hopper"));

		await user.keyboard("{Escape}");

		expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
		expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
		expect(onChange).toHaveBeenLastCalledWith([ada, grace]);
	});
});

describe("LookupSelect — the shared renderers", () => {
	/** Ids are per-render-tree; the markup either side of them is the subject. */
	const normalize = (html: string) =>
		html
			.replace(/react-select-\d+/g, "react-select")
			.replace(/_r_[0-9a-z]+_/g, "_rid_");

	async function openedOptionMarkup(ui: React.ReactElement) {
		const user = userEvent.setup();
		renderWithChakra(ui);
		await user.click(screen.getByRole("combobox"));
		const label = await screen.findByText("Ada Lovelace");
		const option = label.closest('[role="option"]');
		if (!option) throw new Error("the option row never rendered");
		return normalize(option.outerHTML);
	}

	it("renders an option exactly as BaseSelect renders it", async () => {
		const fromBaseSelect = await openedOptionMarkup(
			<BaseSelect value={null} options={[ada]} />,
		);
		cleanup();

		const fromLookupSelect = await openedOptionMarkup(
			<LookupSelect
				value={null}
				debounceMs={10}
				search={async () => ({ items: [ada] })}
			/>,
		);

		expect(fromLookupSelect).toEqual(fromBaseSelect);
	});

	it("shows an option's avatar, as the shared Option renderer does", async () => {
		const user = userEvent.setup();
		renderWithChakra(
			<LookupSelect
				value={null}
				debounceMs={10}
				search={async () => ({ items: [ada] })}
			/>,
		);

		await user.click(screen.getByRole("combobox"));

		// The Avatar primitive's fallback initials for "Ada Lovelace".
		expect(await screen.findByText("AL")).toBeInTheDocument();
	});
});
