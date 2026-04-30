// src/components/auth-card.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../atoms/button";
import { TextInput } from "../atoms/text-input";
import { Heading, Text } from "../primitives/typography";
import { AuthCard } from "./auth-card";

const meta = {
	title: "Components/AuthCard",
	component: AuthCard,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AuthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleLogo = () => (
	<Heading as="span" size="md" color="primary.700" fontWeight="bold">
		knk
	</Heading>
);

const SampleTopBarRight = () => (
	<>
		<Text fontSize="xs" color="muted">
			Hilfe
		</Text>
		<Text fontSize="xs" color="muted">
			DE / EN
		</Text>
	</>
);

export const Default: Story = {
	args: {
		logo: <SampleLogo />,
		topBarRight: <SampleTopBarRight />,
		eyebrow: "ANMELDUNG",
		title: "Anmelden bei knk",
		subtitle: "Gib deine E-Mail ein, um fortzufahren.",
		children: (
			<>
				<TextInput placeholder="jana.schmid@knk.de" mb="4" />
				<Button colorPalette="primary" variant="solid" w="full">
					Weiter
				</Button>
			</>
		),
	},
};

export const WithFooter: Story = {
	args: {
		...Default.args,
		footer: (
			<Text fontSize="xs">
				Noch kein Konto? <a href="/register">Anmelden</a>
			</Text>
		),
	},
};

export const Wide: Story = {
	args: {
		...Default.args,
		size: "lg",
		title: "Konto erstellen",
		subtitle: "Wähle ein Passwort, um dein Konto zu sichern.",
	},
};

export const NoTopBar: Story = {
	args: {
		...Default.args,
		hideTopBar: true,
	},
};

export const NoBackground: Story = {
	args: {
		...Default.args,
		hideBackground: true,
	},
};
