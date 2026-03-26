import { Badge, Box, Grid as ChakraGrid, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { FileText } from "lucide-react";
import { useState } from "react";
import { SelectableCard } from "./selectable-card";

const meta = {
	title: "Components/SelectableCard",
	component: SelectableCard,
} satisfies Meta<typeof SelectableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<Box maxW="280px">
				<SelectableCard onClick={() => console.log("card clicked")}>
					<SelectableCard.Thumbnail>
						<Box bg="primary.200" w="100%" h="100%" />
					</SelectableCard.Thumbnail>
					<SelectableCard.Body>
						<Text fontWeight="semibold">Document Title</Text>
						<Text fontSize="sm" color="fg.muted">
							Last edited 2 days ago
						</Text>
					</SelectableCard.Body>
					<SelectableCard.Footer>
						<Badge colorPalette="primary">Draft</Badge>
					</SelectableCard.Footer>
				</SelectableCard>
			</Box>
		);
	},
};

export const Selected: Story = {
	render() {
		return (
			<Box maxW="280px">
				<SelectableCard
					selected={true}
					onSelect={() => console.log("toggle")}
					onClick={() => console.log("card clicked")}
				>
					<SelectableCard.Thumbnail>
						<Box bg="primary.200" w="100%" h="100%" />
					</SelectableCard.Thumbnail>
					<SelectableCard.Body>
						<Text fontWeight="semibold">Selected Document</Text>
						<Text fontSize="sm" color="fg.muted">
							This card is currently selected
						</Text>
					</SelectableCard.Body>
					<SelectableCard.Footer>
						<Badge colorPalette="primary">Draft</Badge>
					</SelectableCard.Footer>
				</SelectableCard>
			</Box>
		);
	},
};

export const SelectionVisible: Story = {
	render() {
		return (
			<Box maxW="280px">
				<SelectableCard
					selectionVisible={true}
					onSelect={() => console.log("toggle")}
					onClick={() => console.log("card clicked")}
				>
					<SelectableCard.Thumbnail>
						<Box bg="secondary.200" w="100%" h="100%" />
					</SelectableCard.Thumbnail>
					<SelectableCard.Body>
						<Text fontWeight="semibold">Always-Visible Checkbox</Text>
						<Text fontSize="sm" color="fg.muted">
							Checkbox is always shown
						</Text>
					</SelectableCard.Body>
					<SelectableCard.Footer>
						<Badge colorPalette="secondary">Published</Badge>
					</SelectableCard.Footer>
				</SelectableCard>
			</Box>
		);
	},
};

export const WithIconFallback: Story = {
	render() {
		return (
			<Box maxW="280px">
				<SelectableCard
					onSelect={() => console.log("toggle")}
					onClick={() => console.log("card clicked")}
				>
					<SelectableCard.Thumbnail>
						<FileText size={48} color="var(--chakra-colors-fg-muted)" />
					</SelectableCard.Thumbnail>
					<SelectableCard.Body>
						<Text fontWeight="semibold">report-q4-2025.pdf</Text>
						<Text fontSize="sm" color="fg.muted">
							No preview available
						</Text>
					</SelectableCard.Body>
					<SelectableCard.Footer>
						<Badge colorPalette="gray">PDF</Badge>
					</SelectableCard.Footer>
				</SelectableCard>
			</Box>
		);
	},
};

const CARDS = [
	{ id: "1", title: "Marketing Brief", tag: "Draft" },
	{ id: "2", title: "Q4 Report", tag: "Published" },
	{ id: "3", title: "Brand Guidelines", tag: "Draft" },
	{ id: "4", title: "Product Roadmap", tag: "Review" },
];

const GridDemo = () => {
	const [selected, setSelected] = useState(new Set<string>());

	const toggle = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	return (
		<ChakraGrid templateColumns="repeat(2, 1fr)" gap={4} maxW="600px">
			{CARDS.map((card) => (
				<SelectableCard
					key={card.id}
					selected={selected.has(card.id)}
					selectionVisible={selected.size > 0}
					onSelect={() => toggle(card.id)}
					onClick={() => console.log("navigate to", card.id)}
				>
					<SelectableCard.Thumbnail>
						<Box bg="primary.200" w="100%" h="100%" />
					</SelectableCard.Thumbnail>
					<SelectableCard.Body>
						<Text fontWeight="semibold">{card.title}</Text>
						<Text fontSize="sm" color="fg.muted">
							Shared with team
						</Text>
					</SelectableCard.Body>
					<SelectableCard.Footer>
						<Badge colorPalette="primary">{card.tag}</Badge>
					</SelectableCard.Footer>
				</SelectableCard>
			))}
		</ChakraGrid>
	);
};

export const Grid: Story = {
	render() {
		return <GridDemo />;
	},
};

export const Disabled: Story = {
	render() {
		return (
			<Box maxW="280px">
				<SelectableCard
					disabled={true}
					onSelect={() => console.log("toggle")}
					onClick={() => console.log("card clicked")}
				>
					<SelectableCard.Thumbnail>
						<Box bg="gray.200" w="100%" h="100%" />
					</SelectableCard.Thumbnail>
					<SelectableCard.Body>
						<Text fontWeight="semibold">Archived Document</Text>
						<Text fontSize="sm" color="fg.muted">
							This card is disabled
						</Text>
					</SelectableCard.Body>
					<SelectableCard.Footer>
						<Badge colorPalette="gray">Archived</Badge>
					</SelectableCard.Footer>
				</SelectableCard>
			</Box>
		);
	},
};
