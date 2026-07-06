import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { ControlledFormField } from "./controlled-form-field";
import { FormMarkersProvider } from "./form-markers";

function wrap(ui: ReactNode) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("ControlledFormField — §10 markers", () => {
	it("renders the required asterisk by default", () => {
		wrap(
			<ControlledFormField name="a" label="Name" required>
				<input id="a" />
			</ControlledFormField>,
		);
		expect(screen.getByText("*")).toBeInTheDocument();
	});

	it("renders optionalText on a non-required field", () => {
		wrap(
			<ControlledFormField name="a" label="Name" optionalText="(optional)">
				<input id="a" />
			</ControlledFormField>,
		);
		expect(screen.getByText("(optional)")).toBeInTheDocument();
	});

	it("takes form-level defaults from FormMarkersProvider", () => {
		wrap(
			<FormMarkersProvider
				value={{ showRequiredIndicator: false, optionalText: "(optional)" }}
			>
				<ControlledFormField name="a" label="Required one" required>
					<input id="a" />
				</ControlledFormField>
				<ControlledFormField name="b" label="Optional one">
					<input id="b" />
				</ControlledFormField>
			</FormMarkersProvider>,
		);
		expect(screen.queryByText("*")).toBeNull();
		expect(screen.getByText("(optional)")).toBeInTheDocument();
	});
});
