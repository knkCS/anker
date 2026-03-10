import { Box, Button, Input, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { FormProvider, useForm } from "react-hook-form";
import { DirtyFormGuard } from "./dirty-form-guard";

const meta = {
	title: "Forms/DirtyFormGuard",
	component: DirtyFormGuard,
} satisfies Meta<typeof DirtyFormGuard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<Box p={4}>
				<Text mb={4}>
					DirtyFormGuard requires a React Router context to function.
					It uses RHF's formState.isDirty to detect unsaved changes and
					react-router-dom's useBlocker to intercept navigation.
				</Text>
				<Text fontSize="sm" color="fg.muted">
					In a real app, wrap your form with FormProvider and include
					DirtyFormGuard inside the router context.
				</Text>
			</Box>
		);
	},
};
