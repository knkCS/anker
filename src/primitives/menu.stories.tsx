import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../atoms/button/button";
import {
	MenuContent,
	MenuItem,
	MenuItemGroup,
	MenuRoot,
	MenuSeparator,
	MenuTrigger,
} from "./menu";

const meta = {
	title: "Primitives/Menu",
	component: MenuRoot,
} satisfies Meta<typeof MenuRoot>;

export default meta;
type Story = StoryObj;

export const Default: Story = {
	render() {
		return (
			<MenuRoot>
				<MenuTrigger asChild>
					<Button variant="outline">Open Menu</Button>
				</MenuTrigger>
				<MenuContent>
					<MenuItem value="new">New File</MenuItem>
					<MenuItem value="open">Open File</MenuItem>
					<MenuSeparator />
					<MenuItem value="save">Save</MenuItem>
				</MenuContent>
			</MenuRoot>
		);
	},
};

export const WithGroups: Story = {
	render() {
		return (
			<MenuRoot>
				<MenuTrigger asChild>
					<Button variant="outline">Actions</Button>
				</MenuTrigger>
				<MenuContent>
					<MenuItemGroup title="File">
						<MenuItem value="new">New</MenuItem>
						<MenuItem value="open">Open</MenuItem>
					</MenuItemGroup>
					<MenuSeparator />
					<MenuItemGroup title="Edit">
						<MenuItem value="cut">Cut</MenuItem>
						<MenuItem value="copy">Copy</MenuItem>
						<MenuItem value="paste">Paste</MenuItem>
					</MenuItemGroup>
				</MenuContent>
			</MenuRoot>
		);
	},
};
