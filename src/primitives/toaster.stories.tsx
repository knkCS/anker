import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../atoms/button/button";
import { Stack } from "./layout";
import { Toaster, toaster } from "./toaster";

const meta = {
	title: "Primitives/Toaster",
	decorators: [
		(Story) => (
			<>
				<Story />
				<Toaster />
			</>
		),
	],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
	render() {
		return (
			<Stack direction="row" gap="2">
				<Button
					onClick={() =>
						toaster.create({
							title: "Success",
							description: "Your action was completed successfully.",
							type: "success",
						})
					}
				>
					Success Toast
				</Button>
				<Button
					onClick={() =>
						toaster.create({
							title: "Error",
							description: "Something went wrong.",
							type: "error",
						})
					}
				>
					Error Toast
				</Button>
				<Button
					onClick={() =>
						toaster.create({
							title: "Loading",
							description: "Please wait...",
							type: "loading",
						})
					}
				>
					Loading Toast
				</Button>
				<Button
					onClick={() =>
						toaster.create({
							title: "Info",
							description: "Here is some information.",
							type: "info",
						})
					}
				>
					Info Toast
				</Button>
			</Stack>
		);
	},
};
