import { createTreeCollection } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, File, Folder } from "lucide-react";
import {
	TreeViewBranchControl,
	TreeViewBranchIndicator,
	TreeViewBranchText,
	TreeViewItem,
	TreeViewItemText,
	TreeViewNode,
	TreeViewRoot,
	TreeViewTree,
} from "./tree-view";

const collection = createTreeCollection({
	nodeToValue: (node) => node.id,
	nodeToString: (node) => node.name,
	rootNode: {
		id: "ROOT",
		name: "",
		children: [
			{
				id: "src",
				name: "src",
				children: [
					{
						id: "components",
						name: "components",
						children: [
							{ id: "button.tsx", name: "button.tsx" },
							{ id: "card.tsx", name: "card.tsx" },
						],
					},
					{ id: "index.ts", name: "index.ts" },
				],
			},
			{ id: "package.json", name: "package.json" },
		],
	},
});

const meta = {
	title: "Components/TreeView",
	component: TreeViewRoot,
} satisfies Meta<typeof TreeViewRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<TreeViewRoot collection={collection} maxW="300px">
				<TreeViewTree>
					<TreeViewNode
						render={({ node, nodeState }) =>
							nodeState.isBranch ? (
								<TreeViewBranchControl>
									<TreeViewBranchIndicator>
										<ChevronRight size={14} />
									</TreeViewBranchIndicator>
									<Folder size={14} />
									<TreeViewBranchText>{node.name}</TreeViewBranchText>
								</TreeViewBranchControl>
							) : (
								<TreeViewItem>
									<File size={14} />
									<TreeViewItemText>{node.name}</TreeViewItemText>
								</TreeViewItem>
							)
						}
					/>
				</TreeViewTree>
			</TreeViewRoot>
		);
	},
};
