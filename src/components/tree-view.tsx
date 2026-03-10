import { TreeView as ChakraTreeView } from "@chakra-ui/react";

// Pass-through exports for full composition
export const TreeViewRoot = ChakraTreeView.Root;
TreeViewRoot.displayName = "TreeViewRoot";

export const TreeViewTree = ChakraTreeView.Tree;
TreeViewTree.displayName = "TreeViewTree";

export const TreeViewBranch = ChakraTreeView.Branch;
TreeViewBranch.displayName = "TreeViewBranch";

export const TreeViewBranchContent = ChakraTreeView.BranchContent;
TreeViewBranchContent.displayName = "TreeViewBranchContent";

export const TreeViewBranchControl = ChakraTreeView.BranchControl;
TreeViewBranchControl.displayName = "TreeViewBranchControl";

export const TreeViewBranchTrigger = ChakraTreeView.BranchTrigger;
TreeViewBranchTrigger.displayName = "TreeViewBranchTrigger";

export const TreeViewBranchText = ChakraTreeView.BranchText;
TreeViewBranchText.displayName = "TreeViewBranchText";

export const TreeViewBranchIndicator = ChakraTreeView.BranchIndicator;
TreeViewBranchIndicator.displayName = "TreeViewBranchIndicator";

export const TreeViewItem = ChakraTreeView.Item;
TreeViewItem.displayName = "TreeViewItem";

export const TreeViewItemText = ChakraTreeView.ItemText;
TreeViewItemText.displayName = "TreeViewItemText";

export const TreeViewItemIndicator = ChakraTreeView.ItemIndicator;
TreeViewItemIndicator.displayName = "TreeViewItemIndicator";

export const TreeViewNode = ChakraTreeView.Node;
TreeViewNode.displayName = "TreeViewNode";

export const TreeViewLabel = ChakraTreeView.Label;
TreeViewLabel.displayName = "TreeViewLabel";

export type TreeViewRootProps = ChakraTreeView.RootProps;
export type TreeViewBranchProps = ChakraTreeView.BranchProps;
export type TreeViewItemProps = ChakraTreeView.ItemProps;
