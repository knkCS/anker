import { HStack, Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Mail, Plus } from "lucide-react";
import { Button } from "./button";

const meta = {
	title: "Atoms/Button",
	component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "Button",
	},
};

export const Variants: Story = {
	render() {
		return (
			<HStack gap={2}>
				<Button variant="primary">Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="link">Link</Button>
				<Button variant="link-gray">Link Gray</Button>
			</HStack>
		);
	},
};

export const Sizes: Story = {
	render() {
		return (
			<HStack gap={2} alignItems="center">
				<Button size="xs">Extra Small</Button>
				<Button size="sm">Small</Button>
				<Button size="md">Medium</Button>
				<Button size="lg">Large</Button>
				<Button size="xl">Extra Large</Button>
			</HStack>
		);
	},
};

export const WithIcons: Story = {
	render() {
		return (
			<Stack gap={4}>
				<HStack gap={2}>
					<Button variant="primary">
						<Plus /> Add Item
					</Button>
					<Button variant="secondary">
						<Mail /> Send Mail
					</Button>
				</HStack>
				<HStack gap={2}>
					<Button variant="outline">
						Add Item <Plus />
					</Button>
					<Button variant="outline">
						Send Mail <Mail />
					</Button>
				</HStack>
			</Stack>
		);
	},
};

export const Loading: Story = {
	render() {
		return (
			<HStack gap={2}>
				<Button variant="primary" loading>
					Primary
				</Button>
				<Button variant="secondary" loading>
					Secondary
				</Button>
				<Button variant="outline" loading>
					Outline
				</Button>
			</HStack>
		);
	},
};

export const SolidDefaultsPrimary: Story = {
	render: () => (
		<HStack gap={4}>
			<Button variant="solid">Primary (default)</Button>
			<Button variant="solid" colorPalette="secondary">
				Secondary override
			</Button>
			<Button variant="solid" colorPalette="gray">
				Gray override
			</Button>
		</HStack>
	),
};
