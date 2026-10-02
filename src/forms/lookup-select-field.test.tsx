import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { FormProvider, type UseFormReturn, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type {
	LookupResolveArgs,
	LookupSearchArgs,
} from "../atoms/select/lookup-select";
import type { BaseOption } from "../atoms/select/types";
import { LookupSelectField } from "./lookup-select-field";

const ada: BaseOption = { id: "u1", label: "Ada Lovelace" };
const grace: BaseOption = { id: "u2", label: "Grace Hopper" };
const people = [ada, grace];

const search = vi.fn(async ({ query }: LookupSearchArgs) => ({
	items: people.filter((p) =>
		p.label.toLowerCase().includes(query.toLowerCase()),
	),
}));
const resolve = vi.fn(async ({ ids }: LookupResolveArgs) =>
	people.filter((p) => ids.includes(p.id)),
);

type Values = { owner: string | null; watchers: string[] };

let form: UseFormReturn<Values>;

function Harness({
	children,
	defaultValues = { owner: null, watchers: [] },
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

describe("LookupSelectField", () => {
	it("resolves the stored id to its label", async () => {
		render(
			<Harness defaultValues={{ owner: "u2", watchers: [] }}>
				<LookupSelectField<Values>
					name="owner"
					label="Owner"
					search={search}
					resolve={resolve}
				/>
			</Harness>,
		);
		expect(screen.getByLabelText("Owner")).toHaveRole("combobox");
		expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
	});

	it("stores the picked item's id and keeps its label", async () => {
		const user = userEvent.setup();
		render(
			<Harness>
				<LookupSelectField<Values>
					name="owner"
					label="Owner"
					search={search}
					debounceMs={0}
				/>
			</Harness>,
		);
		await user.click(screen.getByLabelText("Owner"));
		await user.click(await screen.findByText("Ada Lovelace"));
		expect(form.getValues("owner")).toBe("u1");
		expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
	});

	it("stores an array of ids when isMulti", async () => {
		const user = userEvent.setup();
		render(
			<Harness defaultValues={{ owner: null, watchers: ["u1"] }}>
				<LookupSelectField<Values>
					name="watchers"
					label="Watchers"
					search={search}
					resolve={resolve}
					debounceMs={0}
					isMulti
				/>
			</Harness>,
		);
		expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
		await user.click(screen.getByLabelText("Watchers"));
		await user.click(await screen.findByText("Grace Hopper"));
		expect(form.getValues("watchers")).toEqual(["u1", "u2"]);
	});

	it("clears to null when single", async () => {
		const user = userEvent.setup();
		render(
			<Harness defaultValues={{ owner: "u1", watchers: [] }}>
				<LookupSelectField<Values>
					name="owner"
					label="Owner"
					search={search}
					resolve={resolve}
				/>
			</Harness>,
		);
		await screen.findByText("Ada Lovelace");
		await user.pointer({
			keys: "[MouseLeft>]",
			target: screen.getByLabelText("Clear selected options"),
		});
		expect(form.getValues("owner")).toBeNull();
	});

	it("links helper and error text to the input and marks it invalid", async () => {
		const user = userEvent.setup();
		render(
			<Harness
				schema={z.object({
					owner: z.string({ invalid_type_error: "Pick an owner" }),
					watchers: z.array(z.string()),
				})}
			>
				<LookupSelectField<Values>
					name="owner"
					label="Owner"
					helperText="Who answers for it"
					search={search}
				/>
			</Harness>,
		);
		const input = screen.getByLabelText("Owner");
		expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(
			screen.getByText("Who answers for it").id,
		);

		await user.click(screen.getByRole("button", { name: "Submit" }));

		const error = await screen.findByText("Pick an owner");
		await waitFor(() =>
			expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(
				error.id,
			),
		);
		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(input).toHaveFocus();
	});
});
