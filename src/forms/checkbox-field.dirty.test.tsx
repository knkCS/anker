import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { CheckboxField } from "./checkbox-field";

function Harness({ showDirtyState }: { showDirtyState?: boolean }) {
	const form = useForm({ defaultValues: { agree: false } });
	useEffect(() => {
		form.setValue("agree", true, { shouldDirty: true });
	}, [form]);
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>
				<CheckboxField
					name="agree"
					label="I agree"
					showDirtyState={showDirtyState}
				/>
			</FormProvider>
		</ChakraProvider>
	);
}

describe("CheckboxField — dirty marker", () => {
	it("renders the dirty marker dot when dirty", () => {
		const { getByLabelText } = render(<Harness />);
		expect(getByLabelText("ungespeicherte Änderung")).toBeInTheDocument();
	});

	it("suppresses the marker when showDirtyState is false", () => {
		const { queryByLabelText } = render(<Harness showDirtyState={false} />);
		expect(queryByLabelText("ungespeicherte Änderung")).toBeNull();
	});
});
