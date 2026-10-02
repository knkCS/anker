import { ChakraProvider } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { FormProvider, type UseFormReturn, useForm } from "react-hook-form";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { createAnkerTheme } from "../theme/create-theme";
import { IconPickerField } from "./icon-picker-field";

const system = createAnkerTheme();

const offsetHeight = Object.getOwnPropertyDescriptor(
	HTMLElement.prototype,
	"offsetHeight",
);
beforeAll(() => {
	// jsdom has no layout; give the virtual grid a viewport to fill.
	Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
		configurable: true,
		value: 300,
	});
	Element.prototype.scrollTo ??= () => {};
});
afterAll(() => {
	if (offsetHeight) {
		Object.defineProperty(HTMLElement.prototype, "offsetHeight", offsetHeight);
	}
});

type Values = { icon: string | null };

let form: UseFormReturn<Values>;

function Harness({
	children,
	defaultValues = { icon: null },
	schema,
}: {
	children: React.ReactNode;
	defaultValues?: Values;
	schema?: z.ZodType<Values>;
}) {
	form = useForm<Values>({
		defaultValues,
		resolver: schema ? zodResolver(schema) : undefined,
	});
	return (
		<ChakraProvider value={system}>
			<FormProvider {...form}>
				<form onSubmit={form.handleSubmit(() => {})}>
					{children}
					<button type="submit">Submit</button>
				</form>
			</FormProvider>
		</ChakraProvider>
	);
}

describe("IconPickerField", () => {
	it("is labelled by its label and shows the stored name", () => {
		render(
			<Harness defaultValues={{ icon: "file-text" }}>
				<IconPickerField<Values> name="icon" label="Icon" />
			</Harness>,
		);
		const trigger = screen.getByRole("button", { name: "Icon" });
		expect(trigger).toHaveTextContent("file-text");
		// The value is announced as the trigger's description.
		expect(trigger).toHaveAccessibleDescription(/file-text/);
	});

	it("stores the picked icon's lucide name as a plain string", async () => {
		const user = userEvent.setup();
		render(
			<Harness>
				<IconPickerField<Values> name="icon" label="Icon" />
			</Harness>,
		);
		await user.click(screen.getByRole("button", { name: "Icon" }));
		await user.type(
			await screen.findByRole("combobox", { name: "Search icons" }),
			"banknote",
		);
		await user.click(await screen.findByRole("option", { name: "banknote" }));
		expect(form.getValues("icon")).toBe("banknote");
		// Dirty like any other *Field: the Field.Root carries the marker the
		// recipe's tint keys off.
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /^Icon/ }).closest("[data-dirty]"),
			).toHaveAttribute("data-dirty", "true"),
		);
	});

	it("stores null when cleared", async () => {
		const user = userEvent.setup();
		render(
			<Harness defaultValues={{ icon: "banknote" }}>
				<IconPickerField<Values> name="icon" label="Icon" />
			</Harness>,
		);
		await user.click(screen.getByRole("button", { name: "Clear icon" }));
		expect(form.getValues("icon")).toBeNull();
	});

	it("wires helper text and the error message to the trigger", async () => {
		const user = userEvent.setup();
		render(
			<Harness
				schema={z.object({
					icon: z.string({ invalid_type_error: "Pick an icon" }),
				})}
			>
				<IconPickerField<Values>
					name="icon"
					label="Icon"
					helperText="Shown in the sidebar"
				/>
			</Harness>,
		);
		const trigger = screen.getByRole("button", { name: "Icon" });
		expect(trigger).toHaveAccessibleDescription(/Shown in the sidebar/);

		await user.click(screen.getByRole("button", { name: "Submit" }));
		expect(await screen.findByText("Pick an icon")).toBeInTheDocument();
		await waitFor(() =>
			expect(trigger).toHaveAccessibleDescription(/Pick an icon/),
		);
		expect(trigger).toHaveAttribute("aria-invalid", "true");
		// RHF's focus-on-first-error reaches the trigger through field.ref.
		expect(trigger).toHaveFocus();
	});

	it("disables the trigger", () => {
		render(
			<Harness>
				<IconPickerField<Values> name="icon" label="Icon" disabled />
			</Harness>,
		);
		expect(screen.getByRole("button", { name: "Icon" })).toBeDisabled();
	});
});
