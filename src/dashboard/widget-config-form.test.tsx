import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WidgetSettingField } from "./types";
import { WidgetConfigForm } from "./widget-config-form";

const schema: WidgetSettingField[] = [
	{ key: "label", label: "Label", type: "text", defaultValue: "Items" },
	{ key: "count", label: "Count", type: "number", defaultValue: 5 },
	{ key: "show", label: "Show", type: "boolean", defaultValue: true },
];

function setup(onChange = vi.fn(), settings: Record<string, unknown> = {}) {
	render(
		<ChakraProvider value={defaultSystem}>
			<WidgetConfigForm
				schema={schema}
				settings={settings}
				onChange={onChange}
			/>
		</ChakraProvider>,
	);
	return { onChange };
}

describe("WidgetConfigForm", () => {
	it("renders a control per schema field", () => {
		setup();
		expect(screen.getByLabelText("Label")).toBeInTheDocument();
		expect(screen.getByLabelText("Count")).toBeInTheDocument();
		expect(screen.getByLabelText("Show")).toBeInTheDocument();
	});

	it("emits merged settings when a text field changes", () => {
		const { onChange } = setup(vi.fn(), { label: "A", count: 5 });
		fireEvent.change(screen.getByLabelText("Label"), {
			target: { value: "B" },
		});
		expect(onChange).toHaveBeenCalledWith({ label: "B", count: 5 });
	});

	it("coerces number fields to numbers", () => {
		const { onChange } = setup(vi.fn(), { count: 5 });
		fireEvent.change(screen.getByLabelText("Count"), {
			target: { value: "8" },
		});
		expect(onChange).toHaveBeenCalledWith({ count: 8 });
	});

	it("maps a select field's chosen value back to the option's typed value", () => {
		const onChange = vi.fn();
		const selectSchema: WidgetSettingField[] = [
			{
				key: "size",
				label: "Size",
				type: "select",
				options: [
					{ label: "Small", value: 1 },
					{ label: "Large", value: 2 },
				],
				defaultValue: 1,
			},
		];
		render(
			<ChakraProvider value={defaultSystem}>
				<WidgetConfigForm
					schema={selectSchema}
					settings={{ size: 1 }}
					onChange={onChange}
				/>
			</ChakraProvider>,
		);
		fireEvent.change(screen.getByLabelText("Size"), { target: { value: "2" } });
		expect(onChange).toHaveBeenCalledWith({ size: 2 }); // number 2, not the string "2"
	});
});
