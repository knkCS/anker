// src/templates/auth-page-template.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../atoms/button";
import { TextInput } from "../atoms/text-input";
import { Heading, Text } from "../primitives/typography";
import { AuthPageTemplate } from "./auth-page-template";

const meta = {
	title: "Templates/AuthPageTemplate",
	component: AuthPageTemplate,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AuthPageTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

const Logo = () => (
	<Heading as="span" size="md" color="primary.700" fontWeight="bold">
		knk
	</Heading>
);

export const Login: Story = {
	args: {
		logo: <Logo />,
		topBarRight: (
			<>
				<Text fontSize="xs" color="muted">
					Help
				</Text>
				<Text fontSize="xs" color="muted">
					EN
				</Text>
			</>
		),
		eyebrow: "SIGN IN",
		title: "Welcome back",
		subtitle: "Enter your email to continue.",
		children: (
			<>
				<TextInput placeholder="you@example.com" mb="4" />
				<Button colorPalette="primary" variant="solid" w="full">
					Continue
				</Button>
			</>
		),
		footer: (
			<Text fontSize="xs">
				No account? <a href="/register">Create one</a>
			</Text>
		),
	},
};

export const VerifyEmail: Story = {
	args: {
		logo: <Logo />,
		eyebrow: "VERIFY EMAIL",
		title: "Check your inbox",
		subtitle: "We sent a verification link to jana@knk.de.",
		children: (
			<Button colorPalette="primary" variant="outline" w="full">
				Resend email
			</Button>
		),
	},
};
