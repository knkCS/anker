import { Stack, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { RelativeDateTime } from "./relative-datetime";

const meta = {
	title: "Atoms/DateTime",
	component: RelativeDateTime,
} satisfies Meta<typeof RelativeDateTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		date: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
	},
};

export const Variants: Story = {
	args: {
		date: new Date(),
	},
	render() {
		const now = new Date();
		return (
			<Stack gap={2}>
				<Text>
					5 min ago:{" "}
					<RelativeDateTime date={new Date(now.getTime() - 5 * 60000)} />
				</Text>
				<Text>
					1 hour ago:{" "}
					<RelativeDateTime date={new Date(now.getTime() - 3600000)} />
				</Text>
				<Text>
					Yesterday:{" "}
					<RelativeDateTime
						date={new Date(now.getTime() - 86400000)}
						isRelativeToCurrentWeek
					/>
				</Text>
			</Stack>
		);
	},
};
