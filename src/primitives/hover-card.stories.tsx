import { Box, Link, Stack, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { HoverCard } from "./hover-card";

const meta = {
	title: "Primitives/HoverCard",
	component: HoverCard,
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<HoverCard
				content={
					<Box p={4}>
						<Stack gap={2}>
							<Text fontWeight="bold">John Doe</Text>
							<Text fontSize="sm" color="muted">
								Senior Developer at knk Gruppe
							</Text>
						</Stack>
					</Box>
				}
			>
				<Link href="#">@johndoe</Link>
			</HoverCard>
		);
	},
};

export const WithArrow: Story = {
	render() {
		return (
			<HoverCard
				showArrow
				content={
					<Box p={4}>
						<Text fontSize="sm">Hover card with an arrow indicator.</Text>
					</Box>
				}
			>
				<Link href="#">Hover me</Link>
			</HoverCard>
		);
	},
};
