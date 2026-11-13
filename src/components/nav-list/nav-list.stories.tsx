// src/components/nav-list/nav-list.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import {
	AlignVerticalJustifyCenter,
	FileText,
	Newspaper,
	Palette,
	Type,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../atoms/button";
import { DirtyDot } from "../../atoms/dirty-dot";
import { Box, Flex } from "../../primitives/layout";
import { SubNavLayout } from "../../templates/subnav-layout";
import { NavList } from "./nav-list";
import { NavListModeProvider } from "./nav-list-context";

const meta = {
	title: "Components/NavList",
	component: NavList,
	parameters: { layout: "padded" },
} satisfies Meta<typeof NavList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Box w="240px">
			<NavList aria-label="Catalogs">
				<NavList.Group label="Page">
					<NavList.Item icon={<FileText size={14} />} count={1}>
						Page geometries
					</NavList.Item>
					<NavList.Item icon={<Newspaper size={14} />} count={5}>
						Master pages
					</NavList.Item>
				</NavList.Group>
				<NavList.Group label="Typography">
					<NavList.Item icon={<Type size={14} />} count={2}>
						Fonts
					</NavList.Item>
					<NavList.Item
						icon={<AlignVerticalJustifyCenter size={14} />}
						count={10}
						active
					>
						Glue patterns
					</NavList.Item>
				</NavList.Group>
				<NavList.Group label="Visual">
					<NavList.Item icon={<Palette size={14} />} count={5}>
						Colors
					</NavList.Item>
				</NavList.Group>
			</NavList>
		</Box>
	),
};

export const WithoutGroupLabels: Story = {
	render: () => (
		<Box w="240px">
			<NavList aria-label="Flat list">
				<NavList.Group>
					<NavList.Item icon={<FileText size={14} />}>One</NavList.Item>
					<NavList.Item icon={<Newspaper size={14} />} active>
						Two
					</NavList.Item>
					<NavList.Item icon={<Type size={14} />}>Three</NavList.Item>
				</NavList.Group>
			</NavList>
		</Box>
	),
};

export const Collapsed: Story = {
	render: () => (
		<Box w="56px">
			<NavListModeProvider value={{ collapsed: true }}>
				<NavList aria-label="Catalogs">
					<NavList.Group label="Page">
						<NavList.Item icon={<FileText size={14} />}>
							Page geometries
						</NavList.Item>
						<NavList.Item icon={<Newspaper size={14} />}>
							Master pages
						</NavList.Item>
					</NavList.Group>
					<NavList.Group label="Typography">
						<NavList.Item
							icon={<AlignVerticalJustifyCenter size={14} />}
							active
						>
							Glue patterns
						</NavList.Item>
					</NavList.Group>
				</NavList>
			</NavListModeProvider>
		</Box>
	),
};

export const AsChildLink: Story = {
	render: () => (
		<Box w="240px">
			<NavList aria-label="Routes">
				<NavList.Group label="Routes">
					<NavList.Item icon={<FileText size={14} />} active asChild>
						<a href="#a">Active route</a>
					</NavList.Item>
					<NavList.Item icon={<Newspaper size={14} />} asChild>
						<a href="#b">Other route</a>
					</NavList.Item>
				</NavList.Group>
			</NavList>
		</Box>
	),
};

interface TreeNode {
	name: string;
	children: TreeNode[];
}

const TREE: TreeNode[] = [
	{ name: "Paragraph", children: [] },
	{
		name: "Table",
		children: [
			{ name: "Table row", children: [{ name: "Table cell", children: [] }] },
		],
	},
	{ name: "Bullet list", children: [{ name: "List item", children: [] }] },
];

const DIRTY = new Set(["Table cell"]);

const hasDirtyDescendant = (node: TreeNode): boolean =>
	node.children.some((c) => DIRTY.has(c.name) || hasDirtyDescendant(c));

const allParents = (nodes: TreeNode[]): string[] =>
	nodes.flatMap((n) =>
		n.children.length ? [n.name, ...allParents(n.children)] : [],
	);

function TreeDemo() {
	const [open, setOpen] = useState<Set<string>>(() => new Set(["Table"]));
	const [selected, setSelected] = useState("Paragraph");
	const setNodeOpen = (name: string) => (next: boolean) =>
		setOpen((prev) => {
			const copy = new Set(prev);
			if (next) copy.add(name);
			else copy.delete(name);
			return copy;
		});

	const renderNode = (node: TreeNode) => {
		const dirty = DIRTY.has(node.name);
		// The roll-up: a closed parent shows its hidden child's dot.
		const hiddenDirty = !open.has(node.name) && hasDirtyDescendant(node);
		const showDot = dirty || hiddenDirty;
		return (
			<NavList.Item
				key={node.name}
				asChild
				active={selected === node.name}
				expanded={open.has(node.name)}
				onExpandedChange={setNodeOpen(node.name)}
				indicator={showDot ? <DirtyDot boxProps={{ ml: "0" }} /> : null}
				subItems={node.children.map(renderNode)}
			>
				<button
					type="button"
					onClick={() => setSelected(node.name)}
					aria-label={showDot ? `${node.name}, unsaved changes` : undefined}
				>
					{node.name}
				</button>
			</NavList.Item>
		);
	};

	return (
		<Box w="240px">
			<Flex gap="2" mb="2" px="2">
				<Button
					size="xs"
					variant="ghost"
					onClick={() => setOpen(new Set(allParents(TREE)))}
				>
					Expand all
				</Button>
				<Button size="xs" variant="ghost" onClick={() => setOpen(new Set())}>
					Collapse all
				</Button>
			</Flex>
			<NavList aria-label="Nodes">
				<NavList.Group label="Blocks">{TREE.map(renderNode)}</NavList.Group>
			</NavList>
		</Box>
	);
}

/**
 * A tree: items hold `subItems`, and the consumer owns which are open. The
 * chevron only toggles; the label button selects. A collapsed parent shows
 * a dot in its `indicator` slot when a hidden child has unsaved changes.
 * Focus a label and use Arrow Right / Arrow Left.
 */
export const Tree: Story = {
	render: () => <TreeDemo />,
};

/** A tree inside SubNavLayout: collapse the rail with the divider toggle. */
export const TreeInSubNavLayout: Story = {
	render: () => (
		<Box h="360px" borderWidth="1px" borderColor="border">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Outline">
					<NavList.Group label="Outline">
						<NavList.Item
							icon={<FileText size={14} />}
							label="Chapter 1"
							defaultExpanded
							indicator={<DirtyDot boxProps={{ ml: "0" }} />}
							subItems={
								<>
									<NavList.Item
										icon={<Type size={14} />}
										label="Section 1.1"
										active
									>
										Section 1.1
									</NavList.Item>
									<NavList.Item icon={<Type size={14} />} label="Section 1.2">
										Section 1.2
									</NavList.Item>
								</>
							}
						>
							Chapter 1
						</NavList.Item>
						<NavList.Item icon={<FileText size={14} />} label="Chapter 2">
							Chapter 2
						</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<Box p="5">Detail</Box>
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};
