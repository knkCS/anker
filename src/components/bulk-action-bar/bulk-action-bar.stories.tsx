import type { Meta, StoryObj } from "@storybook/react";
import { FolderInput, Tag, Trash2 } from "lucide-react";
import { Box } from "../../primitives/layout";
import { BulkActionBar } from "./bulk-action-bar";

const meta = {
	title: "Components/BulkActionBar",
	component: BulkActionBar,
} satisfies Meta<typeof BulkActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<Box minH="80px" position="relative">
				<BulkActionBar
					selectedCount={3}
					position="relative"
					onClear={() => console.log("Clear selection")}
				>
					<BulkActionBar.Action
						label="Delete"
						colorPalette="red"
						icon={<Trash2 size={14} />}
						onClick={() => console.log("Delete")}
					/>
					<BulkActionBar.Action
						label="Tag"
						icon={<Tag size={14} />}
						onClick={() => console.log("Tag")}
					/>
				</BulkActionBar>
			</Box>
		);
	},
};

export const WithPopover: Story = {
	render() {
		return (
			<Box minH="80px" position="relative">
				<BulkActionBar
					selectedCount={2}
					position="relative"
					onClear={() => console.log("Clear selection")}
				>
					<BulkActionBar.Action
						label="Delete"
						colorPalette="red"
						icon={<Trash2 size={14} />}
						onClick={() => console.log("Delete")}
					/>
					<BulkActionBar.PopoverAction
						label="Move to..."
						icon={<FolderInput size={14} />}
					>
						<Box p={3}>
							<Box fontSize="sm" color="fg.muted">
								Select a destination folder
							</Box>
						</Box>
					</BulkActionBar.PopoverAction>
				</BulkActionBar>
			</Box>
		);
	},
};

export const CustomLabel: Story = {
	render() {
		return (
			<Box minH="80px" position="relative">
				<BulkActionBar
					selectedCount={5}
					position="relative"
					countLabel={(n) => `${n} assets selected`}
					onClear={() => console.log("Clear selection")}
				>
					<BulkActionBar.Action
						label="Delete"
						colorPalette="red"
						icon={<Trash2 size={14} />}
						onClick={() => console.log("Delete")}
					/>
				</BulkActionBar>
			</Box>
		);
	},
};

export const Loading: Story = {
	render() {
		return (
			<Box minH="80px" position="relative">
				<BulkActionBar
					selectedCount={1}
					position="relative"
					onClear={() => console.log("Clear selection")}
				>
					<BulkActionBar.Action
						label="Deleting..."
						colorPalette="red"
						icon={<Trash2 size={14} />}
						loading={true}
						onClick={() => console.log("Delete")}
					/>
				</BulkActionBar>
			</Box>
		);
	},
};

export const Hidden: Story = {
	render() {
		return (
			<Box minH="80px" position="relative">
				<BulkActionBar
					selectedCount={0}
					position="relative"
					onClear={() => console.log("Clear selection")}
				>
					<BulkActionBar.Action
						label="Delete"
						colorPalette="red"
						icon={<Trash2 size={14} />}
						onClick={() => console.log("Delete")}
					/>
				</BulkActionBar>
			</Box>
		);
	},
};
