import type { Meta, StoryObj } from "@storybook/react";
import {
	Building,
	CheckCircle,
	Clock,
	Edit,
	FileText,
	Mail,
	MapPin,
	Phone,
	Plus,
} from "lucide-react";
import { Button } from "../../atoms/button/button";
import { DataList } from "../../atoms/data-list/data-list";
import { Persona } from "../../atoms/persona/persona";
import { StatusBadge } from "../../atoms/status-badge/status-badge";
import { Card } from "../../components/card";
import { FactBox } from "../../components/fact-box";
import {
	TimelineConnector,
	TimelineContent,
	TimelineDescription,
	TimelineIndicator,
	TimelineItem,
	TimelineRoot,
	TimelineTitle,
} from "../../components/timeline";
import {
	Box,
	Flex,
	Grid,
	GridItem,
	HStack,
	Stack,
} from "../../primitives/layout";
import { Heading, Text } from "../../primitives/typography";

const contactDetails = [
	{ label: "Email", value: "sarah.mitchell@knkcs.com" },
	{ label: "Phone", value: "+1 (415) 555-0182" },
	{ label: "Address", value: "742 Market Street, San Francisco, CA 94103" },
	{ label: "Department", value: "Engineering" },
	{ label: "Role", value: "Senior Software Engineer" },
	{ label: "Start Date", value: "March 14, 2021" },
];

const timelineEvents = [
	{
		id: 1,
		title: "Updated contact info",
		description: "Phone number and address were updated.",
		date: "Today, 09:14",
		icon: <Edit size={14} />,
	},
	{
		id: 2,
		title: "Completed onboarding",
		description: "All onboarding tasks marked as done.",
		date: "Yesterday, 15:30",
		icon: <CheckCircle size={14} />,
	},
	{
		id: 3,
		title: "Added to Project Alpha",
		description: "Assigned as lead contributor to Project Alpha.",
		date: "Mar 20, 2025",
		icon: <Plus size={14} />,
	},
	{
		id: 4,
		title: "Document uploaded",
		description: 'Contract "MSA_2025.pdf" was attached.',
		date: "Mar 15, 2025",
		icon: <FileText size={14} />,
	},
	{
		id: 5,
		title: "Account created",
		description: "Profile created and activation email sent.",
		date: "Mar 14, 2021",
		icon: <Clock size={14} />,
	},
];

const relatedContacts = [
	{ name: "James Okafor", label: "Engineering Manager" },
	{ name: "Priya Nair", label: "Product Owner" },
	{ name: "Lucas Brennan", label: "Tech Lead" },
];

function EntityDetailDemo() {
	return (
		<Box maxW="1000px" mx="auto" py={8} px={4}>
			<Grid
				templateColumns={{ base: "1fr", md: "2fr 1fr" }}
				gap={6}
				alignItems="start"
			>
				{/* Left column — main content */}
				<GridItem>
					<Stack gap={6}>
						{/* Header */}
						<Card>
							<Flex
								direction={{ base: "column", sm: "row" }}
								align={{ base: "flex-start", sm: "center" }}
								justify="space-between"
								gap={4}
							>
								<HStack gap={4} align="center">
									<Persona name="Sarah Mitchell" size="lg" />
									<StatusBadge label="Active" color="#38A169" />
								</HStack>
								<Button variant="outline" size="sm">
									<Edit size={14} />
									Edit
								</Button>
							</Flex>
						</Card>

						{/* Contact details */}
						<Card title="Contact Details">
							<DataList
								items={[
									{
										label: (
											<HStack gap={1.5} color="fg.muted">
												<Mail size={14} />
												<Text fontSize="sm">Email</Text>
											</HStack>
										),
										value: <Text fontSize="sm">{contactDetails[0].value}</Text>,
									},
									{
										label: (
											<HStack gap={1.5} color="fg.muted">
												<Phone size={14} />
												<Text fontSize="sm">Phone</Text>
											</HStack>
										),
										value: <Text fontSize="sm">{contactDetails[1].value}</Text>,
									},
									{
										label: (
											<HStack gap={1.5} color="fg.muted">
												<MapPin size={14} />
												<Text fontSize="sm">Address</Text>
											</HStack>
										),
										value: <Text fontSize="sm">{contactDetails[2].value}</Text>,
									},
									{
										label: (
											<HStack gap={1.5} color="fg.muted">
												<Building size={14} />
												<Text fontSize="sm">Department</Text>
											</HStack>
										),
										value: <Text fontSize="sm">{contactDetails[3].value}</Text>,
									},
									{
										label: (
											<Text fontSize="sm" color="fg.muted">
												Role
											</Text>
										),
										value: <Text fontSize="sm">{contactDetails[4].value}</Text>,
									},
									{
										label: (
											<Text fontSize="sm" color="fg.muted">
												Start Date
											</Text>
										),
										value: <Text fontSize="sm">{contactDetails[5].value}</Text>,
									},
								]}
							/>
						</Card>

						{/* Activity Timeline */}
						<Card title="Recent Activity">
							<TimelineRoot>
								{timelineEvents.map((event) => (
									<TimelineItem key={event.id}>
										<TimelineConnector>
											<TimelineIndicator>{event.icon}</TimelineIndicator>
										</TimelineConnector>
										<TimelineContent>
											<TimelineTitle>{event.title}</TimelineTitle>
											<TimelineDescription>
												{event.description}
											</TimelineDescription>
											<Text fontSize="xs" color="fg.subtle" mt={0.5}>
												{event.date}
											</Text>
										</TimelineContent>
									</TimelineItem>
								))}
							</TimelineRoot>
						</Card>
					</Stack>
				</GridItem>

				{/* Right column — sidebar */}
				<GridItem>
					<Stack gap={6}>
						{/* Quick Facts */}
						<FactBox name="Quick Facts" collapsible={false}>
							<Stack gap={3} py={2}>
								<Flex justify="space-between" align="center">
									<Text fontSize="sm" color="fg.muted">
										Open Tasks
									</Text>
									<Text fontSize="sm" fontWeight="semibold">
										3
									</Text>
								</Flex>
								<Flex justify="space-between" align="center">
									<Text fontSize="sm" color="fg.muted">
										Last Login
									</Text>
									<Text fontSize="sm" fontWeight="semibold">
										2 days ago
									</Text>
								</Flex>
								<Flex justify="space-between" align="center">
									<Text fontSize="sm" color="fg.muted">
										Team
									</Text>
									<Text fontSize="sm" fontWeight="semibold">
										Engineering
									</Text>
								</Flex>
								<Flex justify="space-between" align="center">
									<Text fontSize="sm" color="fg.muted">
										Projects
									</Text>
									<Text fontSize="sm" fontWeight="semibold">
										4 active
									</Text>
								</Flex>
								<Flex justify="space-between" align="center">
									<Text fontSize="sm" color="fg.muted">
										Tickets Closed
									</Text>
									<Text fontSize="sm" fontWeight="semibold">
										127
									</Text>
								</Flex>
							</Stack>
						</FactBox>

						{/* Related Contacts */}
						<Card title="Related Contacts">
							<Stack gap={3}>
								{relatedContacts.map((contact) => (
									<HStack
										key={contact.name}
										justify="space-between"
										align="center"
									>
										<Persona
											name={contact.name}
											size="sm"
											label={
												<Stack gap={0}>
													<Text fontSize="sm" fontWeight="medium">
														{contact.name}
													</Text>
													<Text fontSize="xs" color="fg.muted">
														{contact.label}
													</Text>
												</Stack>
											}
										/>
									</HStack>
								))}
							</Stack>
						</Card>
					</Stack>
				</GridItem>
			</Grid>
		</Box>
	);
}

const meta = {
	title: "Showcase/Entity Detail",
	parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <EntityDetailDemo />,
};
