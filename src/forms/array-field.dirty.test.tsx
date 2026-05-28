import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { ArrayField } from "./array-field";

function Harness({
	showDirtyState,
}: {
	showDirtyState?: boolean;
}) {
	const form = useForm({
		defaultValues: { tags: [{ key: "a", value: "apple" }] },
	});
	useEffect(() => {
		form.setValue(
			"tags",
			[
				{ key: "a", value: "apple" },
				{ key: "b", value: "banana" },
			],
			{ shouldDirty: true },
		);
	}, [form]);
	return (
		<ChakraProvider value={defaultSystem}>
			<FormProvider {...form}>
				<ArrayField
					name="tags"
					label="Tags"
					showDirtyState={showDirtyState}
				/>
			</FormProvider>
		</ChakraProvider>
	);
}

describe("ArrayField — dirty marker", () => {
	it("renders the dirty marker dot when dirty", () => {
		const { getByLabelText } = render(<Harness />);
		expect(getByLabelText("ungespeicherte Änderung")).toBeInTheDocument();
	});

	it("suppresses the marker when showDirtyState is false", () => {
		const { queryByLabelText } = render(<Harness showDirtyState={false} />);
		expect(queryByLabelText("ungespeicherte Änderung")).toBeNull();
	});
});
