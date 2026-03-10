import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, File, Folder } from "lucide-react";
import {
	TreeViewBranch,
	TreeViewBranchContent,
	TreeViewBranchControl,
	TreeViewBranchIndicator,
	TreeViewBranchText,
	TreeViewItem,
	TreeViewItemText,
	TreeViewRoot,
	TreeViewTree,
} from "./tree-view";

const meta = {
	title: "Components/TreeView",
	component: TreeViewRoot,
} satisfies Meta<typeof TreeViewRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<TreeViewRoot maxW="300px">
				<TreeViewTree>
					<TreeViewBranch value="src" defaultExpanded>
						<TreeViewBranchControl>
							<TreeViewBranchIndicator>
								<ChevronRight size={14} />
							</TreeViewBranchIndicator>
							<Folder size={14} />
							<TreeViewBranchText>src</TreeViewBranchText>
						</TreeViewBranchControl>
						<TreeViewBranchContent>
							<TreeViewBranch value="components">
								<TreeViewBranchControl>
									<TreeViewBranchIndicator>
										<ChevronRight size={14} />
									</TreeViewBranchIndicator>
									<Folder size={14} />
									<TreeViewBranchText>components</TreeViewBranchText>
								</TreeViewBranchControl>
								<TreeViewBranchContent>
									<TreeViewItem value="button.tsx">
										<File size={14} />
										<TreeViewItemText>button.tsx</TreeViewItemText>
									</TreeViewItem>
									<TreeViewItem value="card.tsx">
										<File size={14} />
										<TreeViewItemText>card.tsx</TreeViewItemText>
									</TreeViewItem>
								</TreeViewBranchContent>
							</TreeViewBranch>
							<TreeViewItem value="index.ts">
								<File size={14} />
								<TreeViewItemText>index.ts</TreeViewItemText>
							</TreeViewItem>
						</TreeViewBranchContent>
					</TreeViewBranch>
					<TreeViewItem value="package.json">
						<File size={14} />
						<TreeViewItemText>package.json</TreeViewItemText>
					</TreeViewItem>
				</TreeViewTree>
			</TreeViewRoot>
		);
	},
};
