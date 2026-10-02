import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { FormProvider, type UseFormReturn, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { BaseOption } from "../atoms/select/types";
import { BaseSelectField } from "./base-select-field";

const admin: BaseOption = { id: "admin", label: "Admin" };
const editor: BaseOption = { id: "editor", label: "Editor" };
const viewer: BaseOption = { id: "viewer", label: "Viewer" };
const options = [admin, editor, viewer];

type Values = { role: string | null; tags: string[] };

let form: UseFormReturn<Values>;

function Harness({
	children,
	defaultValues = { role: null, tags: [] },
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
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>
				<form onSubmit={form.handleSubmit(() => {})}>
					{children}
					<button type="submit">Submit</button>
				</form>
			</FormProvider>
		</ChakraProvider>
	);
}

describe("BaseSelectField", () => {
	it("is labelled by its label and shows the stored id's option", () => {
		render(
			<Harness defaultValues={{ role: "editor", tags: [] }}>
				<BaseSelectField<Values> name="role" label="Role" options={options} />
			</Harness>,
		);
		const input = screen.getByLabelText("Role");
		expect(input).toHaveRole("combobox");
		expect(screen.getByText("Editor")).toBeInTheDocument();
	});

	it("stores the picked option's id, not the option", async () => {
		const user = userEvent.setup();
		render(
			<Harness>
				<BaseSelectField<Values> name="role" label="Role" options={options} />
			</Harness>,
		);
		await user.click(screen.getByLabelText("Role"));
		await user.click(await screen.findByText("Viewer"));
		expect(form.getValues("role")).toBe("viewer");
	});

	it("stores an array of ids when isMulti", async () => {
		const user = userEvent.setup();
		render(
			<Harness defaultValues={{ role: null, tags: ["admin"] }}>
				<BaseSelectField<Values>
					name="tags"
					label="Tags"
					options={options}
					isMulti
				/>
			</Harness>,
		);
		expect(screen.getByText("Admin")).toBeInTheDocument();
		await user.click(screen.getByLabelText("Tags"));
		await user.click(await screen.findByText("Viewer"));
		expect(form.getValues("tags")).toEqual(["admin", "viewer"]);
	});

	it("clears to null when single and clearable", async () => {
		const user = userEvent.setup();
		render(
			<Harness defaultValues={{ role: "admin", tags: [] }}>
				<BaseSelectField<Values> name="role" label="Role" options={options} />
			</Harness>,
		);
		const clear = screen.getByLabelText("Clear selected options");
		// react-select clears on mousedown of the clear indicator.
		await user.pointer({ keys: "[MouseLeft>]", target: clear });
		expect(form.getValues("role")).toBeNull();
	});

	it("does not render a clear control when isClearable is false", () => {
		render(
			<Harness defaultValues={{ role: "admin", tags: [] }}>
				<BaseSelectField<Values>
					name="role"
					label="Role"
					options={options}
					isClearable={false}
				/>
			</Harness>,
		);
		expect(screen.getByText("Admin")).toBeInTheDocument();
		expect(screen.queryByLabelText("Clear selected options")).toBeNull();
	});

	it("finds a stored id inside grouped options", async () => {
		const user = userEvent.setup();
		render(
			<Harness defaultValues={{ role: "viewer", tags: [] }}>
				<BaseSelectField<Values>
					name="role"
					label="Role"
					options={[
						{ label: "Staff", options: [admin, editor] },
						{ label: "Guests", options: [viewer] },
					]}
				/>
			</Harness>,
		);
		expect(screen.getByText("Viewer")).toBeInTheDocument();
		await user.click(screen.getByLabelText("Role"));
		expect(await screen.findByText("Guests")).toBeInTheDocument();
		await user.click(screen.getByText("Admin"));
		expect(form.getValues("role")).toBe("admin");
	});

	it("shows a stored id it has no option for as the id, not blank", () => {
		render(
			<Harness defaultValues={{ role: "retired", tags: [] }}>
				<BaseSelectField<Values> name="role" label="Role" options={options} />
			</Harness>,
		);
		expect(screen.getByText("retired")).toBeInTheDocument();
	});

	it("links helper and error text to the input and marks it invalid", async () => {
		const user = userEvent.setup();
		render(
			<Harness
				schema={z.object({
					role: z.string({ invalid_type_error: "Pick a role" }),
					tags: z.array(z.string()),
				})}
			>
				<BaseSelectField<Values>
					name="role"
					label="Role"
					helperText="Who they are"
					options={options}
				/>
			</Harness>,
		);
		const input = screen.getByLabelText("Role");
		const helper = screen.getByText("Who they are");
		expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(
			helper.id,
		);

		await user.click(screen.getByRole("button", { name: "Submit" }));

		const error = await screen.findByText("Pick a role");
		await waitFor(() =>
			expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(
				error.id,
			),
		);
		expect(input).toHaveAttribute("aria-invalid", "true");
		// RHF registered the control's ref, so focus-on-error lands on it.
		expect(input).toHaveFocus();
	});

	it("marks the label dirty after a change", async () => {
		const user = userEvent.setup();
		render(
			<Harness>
				<BaseSelectField<Values> name="role" label="Role" options={options} />
			</Harness>,
		);
		expect(screen.queryByLabelText("Unsaved changes")).toBeNull();
		await user.click(screen.getByLabelText("Role"));
		await user.click(await screen.findByText("Admin"));
		expect(screen.getByLabelText("Unsaved changes")).toBeInTheDocument();
	});

	it("disables the control when disabled", () => {
		render(
			<Harness>
				<BaseSelectField<Values>
					name="role"
					label="Role"
					options={options}
					disabled
				/>
			</Harness>,
		);
		expect(screen.getByLabelText("Role")).toBeDisabled();
	});
});
