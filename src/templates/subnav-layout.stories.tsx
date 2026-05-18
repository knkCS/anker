// src/templates/subnav-layout.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import {
	AlignVerticalJustifyCenter,
	FileText,
	Newspaper,
	Palette,
	Plus,
	Type,
} from "lucide-react";
import { Button } from "../atoms/button";
import { NavList } from "../components/nav-list/nav-list";
import { Box, Flex } from "../primitives/layout";
import { Text } from "../primitives/typography";
import { SubNavLayout } from "./subnav-layout";

const meta = {
	title: "Templates/SubNavLayout",
	component: SubNavLayout,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SubNavLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const Nav = () => (
	<>
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
	</>
);

const DetailBody = ({ rows = 10 }: { rows?: number }) => (
	<Box p="5">
		<Text fontSize="md" fontWeight="semibold" mb="2">
			Glue patterns
		</Text>
		<Text fontSize="sm" color="muted" mb="4">
			{rows} patterns · used by 47 styles
		</Text>
		<Box
			bg="bg-surface"
			borderWidth="1px"
			borderColor="border"
			borderRadius="sm"
		>
			{Array.from({ length: rows }).map((_, i) => (
				<Flex
					key={i}
					px="3"
					py="2"
					borderBottomWidth={i === rows - 1 ? "0" : "1px"}
					borderColor="border-muted"
					justify="space-between"
				>
					<Text fontSize="sm">pattern-{i + 1}</Text>
					<Text fontSize="sm" color="muted">
						{(i + 1) * 1.2}pt
					</Text>
				</Flex>
			))}
		</Box>
	</Box>
);

export const Default: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const CollapsedByDefault: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout defaultCollapsed>
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const NoGroups: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Flat">
					<NavList.Group>
						<NavList.Item icon={<FileText size={14} />}>One</NavList.Item>
						<NavList.Item icon={<Newspaper size={14} />} active>
							Two
						</NavList.Item>
						<NavList.Item icon={<Type size={14} />}>Three</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody rows={3} />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const WithoutToolbar: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const WithToolbar: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout storageKey="storybook-subnav-with-toolbar">
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<SubNavLayout.Toolbar>
						<input
							placeholder="Filter patterns…"
							style={{
								height: 30,
								width: 240,
								border: "1px solid var(--chakra-colors-gray-300)",
								borderRadius: 4,
								padding: "0 10px",
								fontSize: 13,
							}}
						/>
						<Text fontSize="xs" color="muted">
							10 patterns · ordered by usage
						</Text>
						<Box ml="auto">
							<Button colorPalette="primary" size="sm">
								<Plus size={14} /> Add pattern
							</Button>
						</Box>
					</SubNavLayout.Toolbar>
					<DetailBody />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const LongDetailContent: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Catalogs">
					<Nav />
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody rows={30} />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};

export const AsChildRouter: Story = {
	render: () => (
		<Box h="600px" bg="bg-canvas">
			<SubNavLayout>
				<SubNavLayout.Nav aria-label="Routes">
					<NavList.Group label="Typography">
						<NavList.Item
							icon={<AlignVerticalJustifyCenter size={14} />}
							active
							asChild
						>
							<a href="#glue">Glue patterns</a>
						</NavList.Item>
						<NavList.Item icon={<Type size={14} />} asChild>
							<a href="#fonts">Fonts</a>
						</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>
					<DetailBody rows={3} />
				</SubNavLayout.Detail>
			</SubNavLayout>
		</Box>
	),
};
