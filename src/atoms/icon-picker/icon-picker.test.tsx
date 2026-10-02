import { ChakraProvider } from "@chakra-ui/react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, useState } from "react";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { createAnkerTheme } from "../../theme/create-theme";
import { IconPicker, type IconPickerProps } from "./icon-picker";

const system = createAnkerTheme();

// jsdom performs no layout, so the virtualiser would see a 0×0 viewport and
// render no rows. Fake a viewport tall enough for a few rows — the same trick
// virtualized-message-list.test.tsx uses.
const offsetDescriptors = {
	offsetHeight: Object.getOwnPropertyDescriptor(
		HTMLElement.prototype,
		"offsetHeight",
	),
	offsetWidth: Object.getOwnPropertyDescriptor(
		HTMLElement.prototype,
		"offsetWidth",
	),
};
beforeAll(() => {
	Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
		configurable: true,
		value: 300,
	});
	Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
		configurable: true,
		value: 400,
	});
	// Element.scrollTo is missing in jsdom; the virtualiser scrolls the active
	// row into view with it.
	Element.prototype.scrollTo ??= () => {};
});
afterAll(() => {
	for (const [name, descriptor] of Object.entries(offsetDescriptors)) {
		if (descriptor) {
			Object.defineProperty(HTMLElement.prototype, name, descriptor);
		}
	}
});
afterEach(() => {
	localStorage.clear();
});

function Harness(
	props: Partial<IconPickerProps> & { initial?: string | null },
) {
	const { initial = null, onChange, ...rest } = props;
	const [value, setValue] = useState<string | null>(initial);
	return (
		<IconPicker
			value={value}
			onChange={(next) => {
				setValue(next);
				onChange?.(next);
			}}
			{...rest}
		/>
	);
}

function renderPicker(
	props: Partial<IconPickerProps> & { initial?: string | null } = {},
) {
	const onChange = vi.fn();
	const user = userEvent.setup();
	render(
		<StrictMode>
			<ChakraProvider value={system}>
				<Harness onChange={onChange} {...props} />
			</ChakraProvider>
		</StrictMode>,
	);
	return { onChange, user };
}

async function open(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByTestId("icon-picker-trigger"));
	return screen.findByRole("listbox", { name: "Icons" });
}

describe("IconPicker", () => {
	it("shows the placeholder when nothing is chosen", () => {
		renderPicker();
		expect(screen.getByTestId("icon-picker-trigger")).toHaveTextContent(
			"Choose an icon",
		);
	});

	it("shows the chosen icon's name and glyph", async () => {
		renderPicker({ initial: "file-text" });
		const button = screen.getByTestId("icon-picker-trigger");
		expect(button).toHaveTextContent("file-text");
		await waitFor(() =>
			expect(button.querySelector("svg.lucide-file-text")).not.toBeNull(),
		);
	});

	it("opens on a search box with focus and a grid of icons", async () => {
		const { user } = renderPicker();
		const grid = await open(user);
		const search = screen.getByRole("combobox", { name: "Search icons" });
		await waitFor(() => expect(search).toHaveFocus());
		expect(within(grid).getAllByRole("option").length).toBeGreaterThan(0);
	});

	it("finds an icon by one of lucide's tags", async () => {
		const { user } = renderPicker();
		await open(user);
		await user.type(
			screen.getByRole("combobox", { name: "Search icons" }),
			"money",
		);
		expect(
			await screen.findByRole("option", { name: "banknote" }),
		).toBeInTheDocument();
	});

	it("stores the picked icon's lucide name and closes", async () => {
		const { user, onChange } = renderPicker();
		await open(user);
		await user.type(
			screen.getByRole("combobox", { name: "Search icons" }),
			"banknote",
		);
		await user.click(await screen.findByRole("option", { name: "banknote" }));
		expect(onChange).toHaveBeenCalledWith("banknote");
		await waitFor(() =>
			expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
		);
		expect(screen.getByTestId("icon-picker-trigger")).toHaveTextContent(
			"banknote",
		);
	});

	it("picks with the keyboard: arrows move the active option, Enter chooses it", async () => {
		const { user, onChange } = renderPicker();
		await open(user);
		const search = screen.getByRole("combobox", { name: "Search icons" });
		await user.type(search, "file");
		const options = await screen.findAllByRole("option");
		// The first result is active from the start, so Enter alone picks it.
		await waitFor(() =>
			expect(search).toHaveAttribute("aria-activedescendant", options[0].id),
		);
		await user.keyboard("{ArrowDown}");
		// One row down, same column: the ninth result of eight-wide rows.
		const ninth = screen.getAllByRole("option")[8];
		expect(search).toHaveAttribute("aria-activedescendant", ninth.id);
		await user.keyboard("{Enter}");
		expect(onChange).toHaveBeenCalledWith(ninth.getAttribute("data-icon"));
	});

	it("moves through the grid with every arrow once the grid has focus", async () => {
		const { user, onChange } = renderPicker();
		const grid = await open(user);
		await user.type(
			screen.getByRole("combobox", { name: "Search icons" }),
			"arrow",
		);
		await screen.findAllByRole("option");
		grid.focus();
		await user.keyboard("{ArrowRight}{ArrowRight}{ArrowLeft}");
		const second = within(grid).getAllByRole("option")[1];
		expect(grid).toHaveAttribute("aria-activedescendant", second.id);
		await user.keyboard(" ");
		expect(onChange).toHaveBeenCalledWith(second.getAttribute("data-icon"));
	});

	it("filters by a lucide category chip", async () => {
		const { user } = renderPicker();
		await open(user);
		const money = await screen.findByRole("radio", { name: "Money" });
		await user.click(money);
		expect(money).toHaveAttribute("aria-checked", "true");
		expect(
			await screen.findByRole("option", { name: "banknote" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("option", { name: "file-text" }),
		).not.toBeInTheDocument();
	});

	it("says so when nothing matches", async () => {
		const { user } = renderPicker();
		await open(user);
		await user.type(
			screen.getByRole("combobox", { name: "Search icons" }),
			"zzzzqqq",
		);
		expect(await screen.findByText("No icons match")).toBeInTheDocument();
	});

	it("marks the chosen icon as selected", async () => {
		const { user } = renderPicker({ initial: "banknote" });
		await open(user);
		await user.type(
			screen.getByRole("combobox", { name: "Search icons" }),
			"banknote",
		);
		expect(
			await screen.findByRole("option", { name: "banknote" }),
		).toHaveAttribute("aria-selected", "true");
	});

	it("keeps a recently-used row in the browser", async () => {
		const { user } = renderPicker({ recentStorageKey: "test:recent" });
		await open(user);
		await user.type(
			screen.getByRole("combobox", { name: "Search icons" }),
			"banknote",
		);
		await user.click(await screen.findByRole("option", { name: "banknote" }));
		expect(JSON.parse(localStorage.getItem("test:recent") ?? "[]")).toEqual([
			"banknote",
		]);
		await waitFor(() =>
			expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
		);

		const grid = await open(user);
		expect(within(grid).getByText("Recently used")).toBeInTheDocument();
		expect(within(grid).getAllByRole("option")[0]).toHaveAttribute(
			"data-icon",
			"banknote",
		);
	});

	it("keeps no recent row when recentStorageKey is null", async () => {
		const { user } = renderPicker({ recentStorageKey: null });
		await open(user);
		await user.type(
			screen.getByRole("combobox", { name: "Search icons" }),
			"banknote",
		);
		await user.click(await screen.findByRole("option", { name: "banknote" }));
		expect(localStorage.length).toBe(0);
	});

	it("clears the value", async () => {
		const { user, onChange } = renderPicker({ initial: "banknote" });
		await user.click(screen.getByRole("button", { name: "Clear icon" }));
		expect(onChange).toHaveBeenCalledWith(null);
		expect(screen.getByTestId("icon-picker-trigger")).toHaveTextContent(
			"Choose an icon",
		);
		expect(
			screen.queryByRole("button", { name: "Clear icon" }),
		).not.toBeInTheDocument();
	});

	it("offers no clear button when isClearable is false", () => {
		renderPicker({ initial: "banknote", isClearable: false });
		expect(
			screen.queryByRole("button", { name: "Clear icon" }),
		).not.toBeInTheDocument();
	});

	it("reports a blur when a pick closes the popover", async () => {
		const onBlur = vi.fn();
		const { user } = renderPicker({ onBlur });
		await open(user);
		await user.type(
			screen.getByRole("combobox", { name: "Search icons" }),
			"banknote",
		);
		await user.click(await screen.findByRole("option", { name: "banknote" }));
		expect(onBlur).toHaveBeenCalled();
	});

	it("does not open when disabled or read-only", async () => {
		const { user } = renderPicker({ disabled: true });
		expect(screen.getByTestId("icon-picker-trigger")).toBeDisabled();
		await user.click(screen.getByTestId("icon-picker-trigger"));
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("does not open when read-only, and offers no clear", async () => {
		const { user } = renderPicker({ initial: "banknote", readOnly: true });
		await user.click(screen.getByTestId("icon-picker-trigger"));
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Clear icon" }),
		).not.toBeInTheDocument();
	});

	it("takes its strings as props", async () => {
		const { user } = renderPicker({
			labels: { placeholder: "Symbol wählen", search: "Symbole suchen" },
		});
		expect(screen.getByTestId("icon-picker-trigger")).toHaveTextContent(
			"Symbol wählen",
		);
		await user.click(screen.getByTestId("icon-picker-trigger"));
		expect(
			await screen.findByRole("combobox", { name: "Symbole suchen" }),
		).toBeInTheDocument();
	});
});
