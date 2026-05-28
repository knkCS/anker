import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Box } from "../primitives/layout";
import { DirtyCounter } from "./dirty-counter";

const meta = {
	title: "Forms/DirtyCounter",
	component: DirtyCounter,
} satisfies Meta<typeof DirtyCounter>;
export default meta;

type Story = StoryObj<typeof meta>;

function StoryShell({
	dirtyCount,
	label,
	hideWhenClean,
}: {
	dirtyCount: number;
	label?: string;
	hideWhenClean?: boolean;
}) {
	const form = useForm({
		defaultValues: { a: "1", b: "2", c: "3" },
	});
	useEffect(() => {
		const keys: Array<"a" | "b" | "c"> = ["a", "b", "c"];
		for (let i = 0; i < dirtyCount; i++) {
			form.setValue(keys[i], "changed", { shouldDirty: true });
		}
	}, [form, dirtyCount]);
	return (
		<FormProvider {...form}>
			<Box p="4">
				<DirtyCounter label={label} hideWhenClean={hideWhenClean} />
			</Box>
		</FormProvider>
	);
}

export const Clean: Story = { render: () => <StoryShell dirtyCount={0} /> };
export const OneDirty: Story = {
	render: () => <StoryShell dirtyCount={1} />,
};
export const ThreeDirty: Story = {
	render: () => <StoryShell dirtyCount={3} />,
};
