// src/components/toolbar.test.tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toolbar } from "./toolbar";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("Toolbar", () => {
	it("renders the root with data-testid='toolbar'", () => {
		renderWithChakra(
			<Toolbar>
				<Toolbar.Right>right</Toolbar.Right>
			</Toolbar>,
		);
		expect(screen.getByTestId("toolbar")).toBeInTheDocument();
	});

	it("Toolbar.Search renders with placeholder and value", () => {
		renderWithChakra(
			<Toolbar>
				<Toolbar.Search placeholder="Find" value="abc" onChange={() => {}} />
			</Toolbar>,
		);
		const input = screen.getByPlaceholderText("Find") as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.value).toBe("abc");
	});

	it("Toolbar.Search calls onChange with new value", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		renderWithChakra(
			<Toolbar>
				<Toolbar.Search placeholder="Find" value="" onChange={onChange} />
			</Toolbar>,
		);
		await user.type(screen.getByPlaceholderText("Find"), "z");
		expect(onChange).toHaveBeenCalledWith("z");
	});

	it("Toolbar.FilterChip renders icon and children", () => {
		renderWithChakra(
			<Toolbar>
				<Toolbar.Filters>
					<Toolbar.FilterChip
						icon={<span data-testid="chip-icon">i</span>}
						onClick={() => {}}
					>
						Role
					</Toolbar.FilterChip>
				</Toolbar.Filters>
			</Toolbar>,
		);
		expect(screen.getByTestId("chip-icon")).toBeInTheDocument();
		expect(screen.getByText("Role")).toBeInTheDocument();
	});

	it("Toolbar.FilterChip onClick fires", async () => {
		const onClick = vi.fn();
		const user = userEvent.setup();
		renderWithChakra(
			<Toolbar>
				<Toolbar.Filters>
					<Toolbar.FilterChip onClick={onClick}>Role</Toolbar.FilterChip>
				</Toolbar.Filters>
			</Toolbar>,
		);
		await user.click(screen.getByText("Role"));
		expect(onClick).toHaveBeenCalledOnce();
	});

	it("Toolbar.FilterChip active=true exposes data-active='true'", () => {
		renderWithChakra(
			<Toolbar>
				<Toolbar.Filters>
					<Toolbar.FilterChip active onClick={() => {}}>
						Role
					</Toolbar.FilterChip>
				</Toolbar.Filters>
			</Toolbar>,
		);
		expect(screen.getByTestId("filter-chip")).toHaveAttribute(
			"data-active",
			"true",
		);
	});

	it("Toolbar.Count renders text content", () => {
		renderWithChakra(
			<Toolbar>
				<Toolbar.Right>
					<Toolbar.Count>5 of 12</Toolbar.Count>
				</Toolbar.Right>
			</Toolbar>,
		);
		expect(screen.getByText("5 of 12")).toBeInTheDocument();
	});
});
