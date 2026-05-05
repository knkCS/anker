import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCellValue } from "./cell-utils";
import { TruncatedTextCell } from "./truncated-text-cell";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("TruncatedTextCell", () => {
	it("renders the value untouched when no maxLength is set", () => {
		renderWithChakra(<TruncatedTextCell value="Hello world" />);
		expect(screen.getByText("Hello world")).toBeInTheDocument();
	});

	it("truncates the value when it exceeds maxLength", () => {
		renderWithChakra(
			<TruncatedTextCell value="abcdefghijklmnop" maxLength={5} />,
		);
		expect(screen.getByText("abcde…")).toBeInTheDocument();
	});

	it("does not truncate when value is shorter than maxLength", () => {
		renderWithChakra(<TruncatedTextCell value="abc" maxLength={10} />);
		expect(screen.getByText("abc")).toBeInTheDocument();
	});

	it("renders the empty cell value when value is null", () => {
		renderWithChakra(<TruncatedTextCell value={null} />);
		expect(screen.getByText(emptyCellValue)).toBeInTheDocument();
	});

	it("renders subText below the primary value when provided", () => {
		renderWithChakra(
			<TruncatedTextCell value="api-key-name" subText="Created 2 days ago" />,
		);
		expect(screen.getByText("api-key-name")).toBeInTheDocument();
		expect(screen.getByText("Created 2 days ago")).toBeInTheDocument();
	});

	it("respects maxLength on the primary value when subText is set", () => {
		renderWithChakra(
			<TruncatedTextCell
				value="abcdefghijklmnop"
				maxLength={5}
				subText="meta"
			/>,
		);
		expect(screen.getByText("abcde…")).toBeInTheDocument();
		expect(screen.getByText("meta")).toBeInTheDocument();
	});

	it("does not render subText when value is null", () => {
		renderWithChakra(<TruncatedTextCell value={null} subText="hidden" />);
		expect(screen.queryByText("hidden")).not.toBeInTheDocument();
	});
});
