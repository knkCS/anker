import { Button, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import {
	Popover,
	PopoverBody,
	PopoverCloseTrigger,
	PopoverContent,
	PopoverHeader,
	PopoverTrigger,
} from "./popover";

const meta = {
	title: "Primitives/Popover",
	component: Popover,
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" size="sm">
						Open Popover
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<PopoverHeader>Settings</PopoverHeader>
					<PopoverBody>
						<Text fontSize="sm">Adjust your preferences here.</Text>
					</PopoverBody>
				</PopoverContent>
			</Popover>
		);
	},
};

export const WithArrow: Story = {
	render() {
		return (
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" size="sm">
						With Arrow
					</Button>
				</PopoverTrigger>
				<PopoverContent showArrow>
					<PopoverBody>
						<Text fontSize="sm">This popover has an arrow.</Text>
					</PopoverBody>
				</PopoverContent>
			</Popover>
		);
	},
};

export const WithClose: Story = {
	render() {
		return (
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" size="sm">
						Closable
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<PopoverHeader>Confirmation</PopoverHeader>
					<PopoverBody>
						<Text fontSize="sm">Are you sure?</Text>
					</PopoverBody>
					<PopoverCloseTrigger />
				</PopoverContent>
			</Popover>
		);
	},
};
