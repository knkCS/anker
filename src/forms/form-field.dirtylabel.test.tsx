import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { FormMarkersProvider } from "./form-markers";
import { InputField } from "./input-field";

function Harness({
	dirtyLabel,
	providerLabel,
}: {
	dirtyLabel?: string;
	providerLabel?: string;
}) {
	const form = useForm({ defaultValues: { name: "alpha" } });
	useEffect(() => {
		form.setValue("name", "beta", { shouldDirty: true });
	}, [form]);
	const field = <InputField name="name" label="Name" dirtyLabel={dirtyLabel} />;
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>
				{providerLabel ? (
					<FormMarkersProvider value={{ dirtyLabel: providerLabel }}>
						{field}
					</FormMarkersProvider>
				) : (
					field
				)}
			</FormProvider>
		</ChakraProvider>
	);
}

describe("FormField — dirty dot label", () => {
	it("defaults to English", () => {
		render(<Harness />);
		expect(screen.getByLabelText("Unsaved changes")).toBeInTheDocument();
	});

	it("takes the form-level default from FormMarkersProvider", () => {
		render(<Harness providerLabel="Nicht gespeichert" />);
		expect(screen.getByLabelText("Nicht gespeichert")).toBeInTheDocument();
	});

	it("explicit prop beats the provider", () => {
		render(<Harness providerLabel="Nicht gespeichert" dirtyLabel="Draft" />);
		expect(screen.getByLabelText("Draft")).toBeInTheDocument();
		expect(screen.queryByLabelText("Nicht gespeichert")).toBeNull();
	});
});
