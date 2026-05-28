import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { SelectField } from "./select-field";

function Harness({ showDirtyState }: { showDirtyState?: boolean }) {
	const form = useForm({ defaultValues: { pick: "a" } });
	useEffect(() => {
		form.setValue("pick", "b", { shouldDirty: true });
	}, [form]);
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>
				<SelectField name="pick" label="Pick" showDirtyState={showDirtyState}>
					<option value="a">Alpha</option>
					<option value="b">Beta</option>
				</SelectField>
			</FormProvider>
		</ChakraProvider>
	);
}

describe("SelectField — dirty visual", () => {
	it("renders the dirty marker dot when dirty", () => {
		const { getByLabelText } = render(<Harness />);
		expect(getByLabelText("ungespeicherte Änderung")).toBeInTheDocument();
	});

	it("suppresses the marker when showDirtyState is false", () => {
		const { queryByLabelText } = render(<Harness showDirtyState={false} />);
		expect(queryByLabelText("ungespeicherte Änderung")).toBeNull();
	});
});
