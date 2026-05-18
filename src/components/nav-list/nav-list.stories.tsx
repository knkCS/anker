// src/components/nav-list/nav-list.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import {
	AlignVerticalJustifyCenter,
	FileText,
	Newspaper,
	Palette,
	Type,
} from "lucide-react";
import { Box } from "../../primitives/layout";
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
