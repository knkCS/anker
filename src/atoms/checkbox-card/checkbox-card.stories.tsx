import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { CheckboxCard, CheckboxCardGroup } from "./checkbox-card";

const meta = {
	title: "Atoms/CheckboxCard",
	component: CheckboxCard,
} satisfies Meta<typeof CheckboxCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: "option-1",
	},
	render() {
		return (
			<CheckboxCardGroup defaultValue={["option-1"]}>
				<CheckboxCard value="option-1">
					<Box p={4} borderWidth="1px" borderRadius="md">
						<Text fontWeight="bold">Option 1</Text>
						<Text fontSize="sm">Description for option 1</Text>
					</Box>
				</CheckboxCard>
				<CheckboxCard value="option-2">
					<Box p={4} borderWidth="1px" borderRadius="md">
						<Text fontWeight="bold">Option 2</Text>
						<Text fontSize="sm">Description for option 2</Text>
					</Box>
				</CheckboxCard>
				<CheckboxCard value="option-3">
					<Box p={4} borderWidth="1px" borderRadius="md">
						<Text fontWeight="bold">Option 3</Text>
						<Text fontSize="sm">Description for option 3</Text>
					</Box>
				</CheckboxCard>
			</CheckboxCardGroup>
		);
	},
};
