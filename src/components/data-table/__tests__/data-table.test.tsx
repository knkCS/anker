import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, type Mock, vi } from "vitest";
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
