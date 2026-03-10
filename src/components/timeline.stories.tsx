import { Badge, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { CheckCircle, Edit, Plus, Trash2 } from "lucide-react";
import {
	TimelineConnector,
	TimelineContent,
	TimelineDescription,
	TimelineIndicator,
	TimelineItem,
	TimelineRoot,
	TimelineTitle,
} from "./timeline";

const meta = {
	title: "Components/Timeline",
	component: TimelineRoot,
} satisfies Meta<typeof TimelineRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		return (
			<TimelineRoot>
				<TimelineItem>
					<TimelineConnector>
						<TimelineIndicator>
							<Plus size={12} />
						</TimelineIndicator>
					</TimelineConnector>
					<TimelineContent>
						<TimelineTitle>Record created</TimelineTitle>
						<TimelineDescription>Jan 15, 2025 at 10:30 AM</TimelineDescription>
					</TimelineContent>
				</TimelineItem>
				<TimelineItem>
					<TimelineConnector>
						<TimelineIndicator>
							<Edit size={12} />
						</TimelineIndicator>
					</TimelineConnector>
					<TimelineContent>
						<TimelineTitle>Status updated to "In Review"</TimelineTitle>
						<TimelineDescription>Jan 16, 2025 at 2:15 PM</TimelineDescription>
					</TimelineContent>
				</TimelineItem>
				<TimelineItem>
					<TimelineConnector>
						<TimelineIndicator colorPalette="green">
							<CheckCircle size={12} />
						</TimelineIndicator>
					</TimelineConnector>
					<TimelineContent>
						<TimelineTitle>Approved</TimelineTitle>
						<TimelineDescription>Jan 17, 2025 at 9:00 AM</TimelineDescription>
					</TimelineContent>
				</TimelineItem>
			</TimelineRoot>
		);
	},
};

export const WithBadges: Story = {
	render() {
		return (
			<TimelineRoot>
				<TimelineItem>
					<TimelineConnector>
						<TimelineIndicator />
					</TimelineConnector>
					<TimelineContent>
						<TimelineTitle>
							User imported <Badge colorPalette="blue">145 records</Badge>
						</TimelineTitle>
						<Text fontSize="xs" color="muted">
							3 days ago
						</Text>
					</TimelineContent>
				</TimelineItem>
				<TimelineItem>
					<TimelineConnector>
						<TimelineIndicator colorPalette="red">
							<Trash2 size={12} />
						</TimelineIndicator>
					</TimelineConnector>
					<TimelineContent>
						<TimelineTitle>
							Deleted <Badge colorPalette="red">2 records</Badge>
						</TimelineTitle>
						<Text fontSize="xs" color="muted">
							2 days ago
						</Text>
					</TimelineContent>
				</TimelineItem>
			</TimelineRoot>
		);
	},
};
