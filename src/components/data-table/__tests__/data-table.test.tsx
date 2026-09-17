import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { DataTableProps } from "../data-table";
import { DataTable } from "../data-table";

type SampleRow = { id: string; name: string; age: number };

const sampleColumns: DataTableProps<SampleRow>["columns"] = [
	{ accessorKey: "name", header: "Name" },
	{ accessorKey: "age", header: "Age" },
];

const sampleData: SampleRow[] = [
	{ id: "1", name: "Alice", age: 30 },
	{ id: "2", name: "Bob", age: 25 },
	{ id: "3", name: "Charlie", age: 35 },
];

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("DataTable", () => {
	it("renders column headers", () => {
		renderWithChakra(<DataTable columns={sampleColumns} data={sampleData} />);

		expect(screen.getByText("Name")).toBeInTheDocument();
		expect(screen.getByText("Age")).toBeInTheDocument();
	});

	it("renders data rows", () => {
		renderWithChakra(<DataTable columns={sampleColumns} data={sampleData} />);

		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
		expect(screen.getByText("Charlie")).toBeInTheDocument();
		expect(screen.getByText("30")).toBeInTheDocument();
		expect(screen.getByText("25")).toBeInTheDocument();
		expect(screen.getByText("35")).toBeInTheDocument();
	});

	it("shows empty state when no data", () => {
		renderWithChakra(<DataTable columns={sampleColumns} data={[]} />);

		expect(screen.getByText("No data available")).toBeInTheDocument();
	});

	it("shows custom empty state when provided", () => {
		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={[]}
				emptyState={<span>Nothing here</span>}
			/>,
		);

		expect(screen.getByText("Nothing here")).toBeInTheDocument();
	});

	it("shows loading state", () => {
		renderWithChakra(<DataTable columns={sampleColumns} data={[]} loading />);

		// Loading rows should be present, but not the empty state
		expect(screen.queryByText("No data available")).not.toBeInTheDocument();
		// There should be hidden loading rows
		const hiddenRows = document.querySelectorAll('tr[aria-hidden="true"]');
		expect(hiddenRows.length).toBe(5);
	});

	it("handles row click", async () => {
		const handleRowClick = vi.fn();
		const user = userEvent.setup();

		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				onRowClick={handleRowClick}
			/>,
		);

		await user.click(screen.getByText("Alice"));
		expect(handleRowClick).toHaveBeenCalledWith(sampleData[0]);
	});

	it("renders pagination when provided", () => {
		const handlePageChange = vi.fn();

		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				total={50}
				page={1}
				pageSize={10}
				onPageChange={handlePageChange}
			/>,
		);

		// Pagination should be rendered with page buttons
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("has correct displayName", () => {
		expect(DataTable.displayName).toBe("DataTable");
	});

	it("calls onSortingChange when a sortable header is clicked", async () => {
		const handleSortingChange = vi.fn();
		const user = userEvent.setup();
		const sortableColumns: DataTableProps<SampleRow>["columns"] = [
			{ accessorKey: "name", header: "Name", enableSorting: true },
			{ accessorKey: "age", header: "Age" },
		];

		renderWithChakra(
			<DataTable
				columns={sortableColumns}
				data={sampleData}
				sorting={[]}
				onSortingChange={handleSortingChange}
			/>,
		);

		await user.click(screen.getByText("Name"));
		expect(handleSortingChange).toHaveBeenCalled();
	});

	it("calls onRowSelectionChange when a row checkbox is clicked", async () => {
		const handleSelectionChange = vi.fn();
		const user = userEvent.setup();

		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				selectable
				rowSelection={{}}
				onRowSelectionChange={handleSelectionChange}
			/>,
		);

		const checkboxes = screen.getAllByRole("checkbox");
		// First checkbox is select-all, rest are per-row
		await user.click(checkboxes[1]);
		expect(handleSelectionChange).toHaveBeenCalled();
	});

	it("uses getRowId for stable row identity", () => {
		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				selectable
				rowSelection={{ "1": true }}
				onRowSelectionChange={vi.fn()}
				getRowId={(row) => row.id}
			/>,
		);

		const checkboxes = screen.getAllByRole("checkbox");
		// Row with id="1" (Alice) should be selected
		expect(checkboxes[1]).toBeChecked();
	});
});

/**
 * jsdom gives every element a zero-sized rect, and dnd-kit needs real geometry
 * to decide which row a keyboard move lands on. Give each body row a 50px band.
 */
function layoutRows(): void {
	const rows = Array.from(document.querySelectorAll("tbody tr"));
	rows.forEach((row, index) => {
		const top = index * 50;
		(row as HTMLElement).getBoundingClientRect = () =>
			({
				x: 0,
				y: top,
				top,
				bottom: top + 50,
				left: 0,
				right: 300,
				width: 300,
				height: 50,
				toJSON: () => ({}),
			}) as DOMRect;
	});
}

/**
 * Sortable headers carry role="button", so the columnheader role query does not
 * see them — count the `th` elements directly.
 */
function headerCells(): Element[] {
	return Array.from(document.querySelectorAll("thead th"));
}

/**
 * jsdom ships no PointerEvent, so dnd-kit's pointer sensor never sees a usable
 * event. A MouseEvent subclass carrying the pointer fields is enough for it.
 */
class PointerEventPolyfill extends MouseEvent {
	readonly pointerId: number;
	readonly pointerType: string;
	readonly isPrimary: boolean;

	constructor(
		type: string,
		init: MouseEventInit & {
			pointerId?: number;
			pointerType?: string;
			isPrimary?: boolean;
		} = {},
	) {
		super(type, init);
		this.pointerId = init.pointerId ?? 1;
		this.pointerType = init.pointerType ?? "mouse";
		this.isPrimary = init.isPrimary ?? true;
	}
}

describe("DataTable row reorder", () => {
	beforeAll(() => {
		if (!("PointerEvent" in window)) {
			(window as unknown as { PointerEvent: unknown }).PointerEvent =
				PointerEventPolyfill;
		}
	});

	it("renders no drag handle column without onRowReorder", () => {
		renderWithChakra(<DataTable columns={sampleColumns} data={sampleData} />);

		expect(screen.queryByRole("button", { name: /reorder row/i })).toBeNull();
		expect(screen.queryByText("Reorder")).toBeNull();
		// Only the two consumer columns are rendered.
		expect(headerCells()).toHaveLength(2);
	});

	it("renders one labelled drag handle per row when onRowReorder is set", () => {
		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				onRowReorder={vi.fn()}
			/>,
		);

		expect(headerCells()).toHaveLength(3);
		expect(
			screen.getAllByRole("button", { name: /reorder row/i }),
		).toHaveLength(3);
		expect(
			screen.getByRole("button", { name: "Reorder row 2" }),
		).toBeInTheDocument();
	});

	it("reports the move to onRowReorder when a row is dragged down by keyboard", async () => {
		const handleReorder = vi.fn();
		const user = userEvent.setup();

		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				onRowReorder={handleReorder}
			/>,
		);
		layoutRows();

		const handle = screen.getByRole("button", { name: "Reorder row 1" });
		handle.focus();
		await user.keyboard("[Space]");
		await user.keyboard("[ArrowDown]");
		await user.keyboard("[Space]");

		expect(handleReorder).toHaveBeenCalledWith(0, 1);
	});

	it("reports the move to onRowReorder when a row is dragged by pointer", async () => {
		const handleReorder = vi.fn();

		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				onRowReorder={handleReorder}
			/>,
		);
		layoutRows();

		const handle = screen.getByRole("button", { name: "Reorder row 1" });
		// Each step gets its own act(): the sensor only attaches its document
		// listeners once React has re-rendered after the activating pointerdown.
		await act(async () => {
			fireEvent.pointerDown(handle, {
				button: 0,
				isPrimary: true,
				clientX: 10,
				clientY: 25,
			});
		});
		await act(async () => {
			// The pointer sensor needs movement past its 4px threshold to engage.
			fireEvent.pointerMove(document, { clientX: 10, clientY: 40 });
			fireEvent.pointerMove(document, { clientX: 10, clientY: 125 });
		});
		await act(async () => {
			fireEvent.pointerUp(document, { clientX: 10, clientY: 125 });
		});

		expect(handleReorder).toHaveBeenCalledWith(0, 2);
	});

	it("reports the move when a row is dragged up by keyboard", async () => {
		const handleReorder = vi.fn();
		const user = userEvent.setup();

		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				onRowReorder={handleReorder}
			/>,
		);
		layoutRows();

		const handle = screen.getByRole("button", { name: "Reorder row 3" });
		handle.focus();
		await user.keyboard("[Space]");
		await user.keyboard("[ArrowUp]");
		await user.keyboard("[Space]");

		expect(handleReorder).toHaveBeenCalledWith(2, 1);
	});

	it("does not report a move when the drag is cancelled", async () => {
		const handleReorder = vi.fn();
		const user = userEvent.setup();

		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				onRowReorder={handleReorder}
			/>,
		);
		layoutRows();

		const handle = screen.getByRole("button", { name: "Reorder row 1" });
		handle.focus();
		await user.keyboard("[Space]");
		await user.keyboard("[ArrowDown]");
		await user.keyboard("[Escape]");

		expect(handleReorder).not.toHaveBeenCalled();
	});

	it("announces the reorder for screen readers", async () => {
		const user = userEvent.setup();

		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				onRowReorder={vi.fn()}
			/>,
		);
		layoutRows();

		const handle = screen.getByRole("button", { name: "Reorder row 1" });
		expect(handle).toHaveAttribute("aria-describedby");

		handle.focus();
		await user.keyboard("[Space]");
		// dnd-kit follows the pick-up with an immediate "over itself" event, so
		// the live region already holds the position readout at this point.
		expect(screen.getByRole("status")).toHaveTextContent(
			"Row 1 moved to position 1 of 3.",
		);

		await user.keyboard("[ArrowDown]");
		expect(screen.getByRole("status")).toHaveTextContent(
			"Row 1 moved to position 2 of 3.",
		);

		await user.keyboard("[Space]");
		expect(screen.getByRole("status")).toHaveTextContent(
			"Row dropped at position 2 of 3.",
		);
	});

	it("does not trigger onRowClick when the handle is clicked", async () => {
		const handleRowClick = vi.fn();
		const user = userEvent.setup();

		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				onRowClick={handleRowClick}
				onRowReorder={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Reorder row 1" }));
		expect(handleRowClick).not.toHaveBeenCalled();
	});

	it("keeps the selection column alongside the handle column", () => {
		renderWithChakra(
			<DataTable
				columns={sampleColumns}
				data={sampleData}
				selectable
				rowSelection={{}}
				onRowSelectionChange={vi.fn()}
				onRowReorder={vi.fn()}
			/>,
		);

		expect(headerCells()).toHaveLength(4);
		expect(
			screen.getAllByRole("button", { name: /reorder row/i }),
		).toHaveLength(3);
		expect(screen.getAllByRole("checkbox")).toHaveLength(4);
	});
});
