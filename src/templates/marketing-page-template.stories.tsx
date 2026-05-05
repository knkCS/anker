// src/templates/marketing-page-template.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../atoms/button";
import { Box, Flex, Grid, GridItem } from "../primitives/layout";
import { Heading, Text } from "../primitives/typography";
import { MarketingPageTemplate } from "./marketing-page-template";

const meta = {
	title: "Templates/MarketingPageTemplate",
	component: MarketingPageTemplate,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MarketingPageTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

const Logo = () => (
	<Heading as="span" size="md" color="primary.700" fontWeight="bold">
		knk
	</Heading>
);

export const Default: Story = {
	render: () => (
		<MarketingPageTemplate
			logo={<Logo />}
			topBarRight={
				<>
					<Text>Product</Text>
					<Text>Customers</Text>
					<Text>Pricing</Text>
					<Button size="sm" colorPalette="primary">
						Sign in
					</Button>
				</>
			}
			heroEyebrow="IDENTITY · ACCESS · GOVERNANCE"
			heroTitle="One sign-in for every knk product."
			heroSubtitle="Odon is the identity backbone for the knkCMS platform — SSO, MFA, social login, and audit-ready logs in one self-hosted service."
			heroActions={
				<>
					<Button colorPalette="primary" size="md">
						Get started
					</Button>
					<Button variant="ghost" size="md">
						Read the docs →
					</Button>
				</>
			}
			footer={
				<Flex justify="space-between" align="center">
					<Text fontSize="sm" color="muted">
						© 2026 knk Gruppe
					</Text>
					<Flex gap="6" fontSize="sm" color="muted">
						<Text>Privacy</Text>
						<Text>Terms</Text>
						<Text>Status</Text>
					</Flex>
				</Flex>
			}
		>
			<Box>
				<Heading
					as="h2"
					fontSize="3xl"
					fontWeight="semibold"
					color="default"
					mb="8"
					textAlign="center"
					letterSpacing="-0.02em"
				>
					What's inside
				</Heading>
				<Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="6">
					<GridItem>
						<Heading size="md" mb="2">
							Single sign-on
						</Heading>
						<Text color="muted" fontSize="sm">
							OIDC + OAuth2 with rotation, JWKS, and refresh-token reuse
							detection.
						</Text>
					</GridItem>
					<GridItem>
						<Heading size="md" mb="2">
							Multi-factor auth
						</Heading>
						<Text color="muted" fontSize="sm">
							TOTP, WebAuthn, and email OTP — enforced per-org or per-user.
						</Text>
					</GridItem>
					<GridItem>
						<Heading size="md" mb="2">
							Audit trail
						</Heading>
						<Text color="muted" fontSize="sm">
							Every authentication event recorded, queryable, exportable.
						</Text>
					</GridItem>
				</Grid>
			</Box>
		</MarketingPageTemplate>
	),
};
