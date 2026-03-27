import type { Meta, StoryObj } from "@storybook/react";
import { Plus, Settings } from "lucide-react";
import { Button } from "../atoms/button";
import { Badge } from "../primitives/badge";
import { Box, Stack } from "../primitives/layout";
import { Text } from "../primitives/typography";
import { SidebarSection } from "./sidebar-section";

const meta = {
	title: "Components/SidebarSection",
	component: SidebarSection,
} satisfies Meta<typeof SidebarSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {
	args: {
		label: "Type",
		children: <Text fontSize="sm">Product Image</Text>,
	},
};

export const WithAction: Story = {
	args: {
		label: "Tags",
		actionIcon: <Plus size={14} />,
		onAction: () => console.log("Open tag modal"),
		children: (
			<Stack direction="row" gap={1} flexWrap="wrap">
				<Badge colorPalette="blue">Design</Badge>
				<Badge colorPalette="green">Electronics</Badge>
			</Stack>
		),
	},
};

export const TwoSlotEdit: Story = {
	args: {
		label: "Labels",
		actionIcon: <Settings size={14} />,
		editContent: (
			<Stack gap={2} p={2} bg="bg.subtle" rounded="md">
				<Text fontSize="sm" fontWeight="medium">
					Select labels:
				</Text>
				<Stack direction="row" gap={1} flexWrap="wrap">
					<Badge colorPalette="blue" cursor="pointer">
						Design
					</Badge>
					<Badge colorPalette="gray" cursor="pointer">
						Marketing
					</Badge>
					<Badge colorPalette="gray" cursor="pointer">
						Engineering
					</Badge>
				</Stack>
			</Stack>
		),
		children: (
			<Stack direction="row" gap={1} flexWrap="wrap">
				<Badge colorPalette="blue">Design</Badge>
			</Stack>
		),
	},
};

const RenderPropDemo = () => (
	<SidebarSection label="Status" actionIcon={<Settings size={14} />}>
		{({ isEditing, setEditing }) => (
			<Box>
				<Text fontSize="sm" mb={2}>
					{isEditing ? "Pick a new status:" : "Published"}
				</Text>
				{isEditing && (
					<Stack direction="row" gap={1} mb={2}>
						<Button
							size="xs"
							variant="outline"
							onClick={() => setEditing(false)}
						>
							Draft
						</Button>
						<Button
							size="xs"
							colorPalette="green"
							onClick={() => setEditing(false)}
						>
							Published
						</Button>
					</Stack>
				)}
				{!isEditing && (
					<Button size="xs" variant="outline" onClick={() => setEditing(true)}>
						Change status
					</Button>
				)}
			</Box>
		)}
	</SidebarSection>
);

export const RenderProp: Story = {
	render: () => <RenderPropDemo />,
};

export const EmptyState: Story = {
	args: {
		label: "Assigned Categories",
		emptyText: "No items assigned",
		children: null,
	},
};

export const StackedSections: Story = {
	render() {
		return (
			<Box maxW="280px">
				<Box borderBottomWidth="1px" borderColor="border">
					<SidebarSection label="Author">
						<Text fontSize="sm">Jane Doe</Text>
					</SidebarSection>
				</Box>
				<Box borderBottomWidth="1px" borderColor="border">
					<SidebarSection
						label="Tags"
						actionIcon={<Plus size={14} />}
						onAction={() => console.log("Add tag")}
					>
						<Stack direction="row" gap={1} flexWrap="wrap">
							<Badge colorPalette="blue">Design</Badge>
							<Badge colorPalette="green">Electronics</Badge>
						</Stack>
					</SidebarSection>
				</Box>
				<SidebarSection label="Published At" emptyText="Not published yet">
					{null}
				</SidebarSection>
			</Box>
		);
	},
};
