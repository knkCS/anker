import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { FormField } from "./form-field";
import { FormMarkersProvider } from "./form-markers";
import { InputField } from "./input-field";

function Harness({ children }: { children: ReactElement }) {
	const form = useForm({ defaultValues: { name: "" } });
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>{children}</FormProvider>
		</ChakraProvider>
	);
}

const input = (field: { value?: unknown }) => (
	<input value={(field.value as string) ?? ""} readOnly />
);

describe("FormField — §10 markers", () => {
	it("renders the required asterisk by default", () => {
		render(
			<Harness>
				<FormField name="name" label="Name" required>
					{input}
				</FormField>
			</Harness>,
		);
		expect(screen.getByText("*")).toBeInTheDocument();
	});

	it("renders no asterisk when not required", () => {
		render(
			<Harness>
				<FormField name="name" label="Name">
					{input}
				</FormField>
			</Harness>,
		);
		expect(screen.queryByText("*")).toBeNull();
	});

	it("renders optionalText on a non-required field", () => {
		render(
			<Harness>
				<FormField name="name" label="Name" optionalText="(optional)">
					{input}
				</FormField>
			</Harness>,
		);
		expect(screen.getByText("(optional)")).toBeInTheDocument();
	});

	it("never shows optionalText on a required field (asterisk only)", () => {
		render(
			<Harness>
				<FormField name="name" label="Name" required optionalText="(optional)">
					{input}
				</FormField>
			</Harness>,
		);
		expect(screen.getByText("*")).toBeInTheDocument();
		expect(screen.queryByText("(optional)")).toBeNull();
	});

	it("suppresses the asterisk with showRequiredIndicator={false}", () => {
		render(
			<Harness>
				<FormField
					name="name"
					label="Name"
					required
					showRequiredIndicator={false}
				>
					{input}
				</FormField>
			</Harness>,
		);
		expect(screen.queryByText("*")).toBeNull();
	});

	it("takes form-level defaults from FormMarkersProvider", () => {
		render(
			<Harness>
				<FormMarkersProvider
					value={{ showRequiredIndicator: false, optionalText: "(optional)" }}
				>
					<FormField name="name" label="Required one" required>
						{input}
					</FormField>
					<FormField name="name" label="Optional one">
						{input}
					</FormField>
				</FormMarkersProvider>
			</Harness>,
		);
		expect(screen.queryByText("*")).toBeNull();
		expect(screen.getByText("(optional)")).toBeInTheDocument();
	});

	it("explicit props beat the provider", () => {
		render(
			<Harness>
				<FormMarkersProvider
					value={{ showRequiredIndicator: false, optionalText: "(optional)" }}
				>
					<FormField name="name" label="Name" required showRequiredIndicator>
						{input}
					</FormField>
					<FormField name="name" label="Other" optionalText="(optioneel)">
						{input}
					</FormField>
				</FormMarkersProvider>
			</Harness>,
		);
		expect(screen.getByText("*")).toBeInTheDocument();
		expect(screen.getByText("(optioneel)")).toBeInTheDocument();
		expect(screen.queryByText("(optional)")).toBeNull();
	});

	it("forwards through a field wrapper via rest props (InputField)", () => {
		render(
			<Harness>
				<InputField name="name" label="Name" optionalText="(optional)" />
			</Harness>,
		);
		expect(screen.getByText("(optional)")).toBeInTheDocument();
	});
});
