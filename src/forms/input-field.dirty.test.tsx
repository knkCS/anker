import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { InputField } from "./input-field";

function Harness({
	showDirtyState,
}: {
	showDirtyState?: boolean;
}) {
	const form = useForm({ defaultValues: { name: "alpha" } });
	useEffect(() => {
		form.setValue("name", "beta", { shouldDirty: true });
	}, [form]);
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>
				<InputField name="name" label="Name" showDirtyState={showDirtyState} />
			</FormProvider>
		</ChakraProvider>
	);
}

describe("InputField — dirty visual", () => {
	it("renders the dirty marker dot when dirty (label is a string)", () => {
		const { getByLabelText } = render(<Harness />);
		expect(getByLabelText("ungespeicherte Änderung")).toBeInTheDocument();
	});

	it("suppresses the marker when showDirtyState is false", () => {
		const { queryByLabelText } = render(<Harness showDirtyState={false} />);
		expect(queryByLabelText("ungespeicherte Änderung")).toBeNull();
	});
});
