import { Box, Stack, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Plus, Settings } from "lucide-react";
import { Button } from "../atoms/button";
import { SidebarSection } from "./sidebar-section";

const meta = {
	title: "Components/SidebarSection",
	component: SidebarSection,
} satisfies Meta<typeof SidebarSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {
	args: {
		label: "Image",
		children: <Text fontSize="sm">Product Image</Text>,
	},
};

export const WithAction: Story = {
	args: {
		label: "Tags",
		actionIcon: <Plus size={14} />,
		onAction: () => console.log("action triggered"),
		children: <Text fontSize="sm">Design, Electronics</Text>,
	},
};

export const TwoSlotEdit: Story = {
	args: {
		label: "Settings",
		actionIcon: <Settings size={14} />,
		editContent: (
			<Box p={2} bg="bg.subtle" rounded="md">
				Edit form goes here
			</Box>
		),
		children: <Text fontSize="sm">Default configuration</Text>,
	},
};

export const RenderProp: Story = {
	args: {
		label: "Status",
		actionIcon: <Settings size={14} />,
		editContent: <Box />,
		children: ({
			isEditing,
			setEditing,
		}: {
			isEditing: boolean;
			setEditing: (v: boolean) => void;
		}) => (
			<Box>
				<Text fontSize="sm" mb={2}>
					{isEditing ? "Editing" : "Viewing"}
				</Text>
				<Button
					size="xs"
					variant="outline"
					onClick={() => setEditing(!isEditing)}
				>
					{isEditing ? "Cancel" : "Edit"}
				</Button>
			</Box>
		),
	},
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
			<Box borderBottomWidth="1px" borderColor="border">
				<Box borderBottomWidth="1px" borderColor="border">
					<SidebarSection label="Author">
						<Text fontSize="sm">Jane Doe</Text>
					</SidebarSection>
				</Box>
				<Box borderBottomWidth="1px" borderColor="border">
					<SidebarSection
						label="Tags"
						actionIcon={<Plus size={14} />}
						onAction={() => console.log("add tag")}
					>
						<Stack direction="row" gap={1} flexWrap="wrap">
							<Text fontSize="sm">Design</Text>
							<Text fontSize="sm">·</Text>
							<Text fontSize="sm">Electronics</Text>
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
