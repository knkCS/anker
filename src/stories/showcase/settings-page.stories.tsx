import {
	Box,
	Flex,
	Heading,
	HStack,
	Separator,
	Stack,
	Text,
} from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Bell, Settings, Shield, User } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "../../atoms/button/button";
import { Card } from "../../components/card";
import { Modal } from "../../components/modal";
import { InputField } from "../../forms/input-field";
import { SelectField } from "../../forms/select-field";
import { TextareaField } from "../../forms/textarea-field";

interface SettingsFormValues {
	name: string;
	email: string;
	bio: string;
	notificationFrequency: string;
	currentPassword: string;
	newPassword: string;
}

function SettingsPageDemo() {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [saved, setSaved] = useState(false);

	const methods = useForm<SettingsFormValues>({
		defaultValues: {
			name: "Alex Johnson",
			email: "alex.johnson@example.com",
			bio: "Product designer and occasional developer. Passionate about clean interfaces and thoughtful UX.",
			notificationFrequency: "daily",
			currentPassword: "",
			newPassword: "",
		},
	});

	function handleSaveClick() {
		setConfirmOpen(true);
	}

	function handleConfirmSave() {
		setConfirmOpen(false);
		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	}

	function handleCancel() {
		methods.reset();
	}

	return (
		<FormProvider {...methods}>
			<Box maxW="800px" mx="auto" py={8} px={4}>
				{/* Page header */}
				<Stack gap={1} mb={8}>
					<HStack gap={3}>
						<Settings size={24} />
						<Heading size="xl">Settings</Heading>
					</HStack>
					<Text color="fg.muted" fontSize="sm">
						Manage your account preferences and security settings.
					</Text>
				</Stack>

				<Stack gap={6}>
					{/* Profile card */}
					<Card
						header={
							<HStack gap={2}>
								<User size={18} />
								<Heading size="sm">Profile</Heading>
							</HStack>
						}
					>
						<Stack gap={4}>
							<InputField<SettingsFormValues>
								name="name"
								label="Display name"
								placeholder="Your full name"
							/>
							<InputField<SettingsFormValues>
								name="email"
								label="Email address"
								placeholder="you@example.com"
								type="email"
							/>
							<TextareaField<SettingsFormValues>
								name="bio"
								label="Bio"
								placeholder="Tell us a little about yourself…"
								textareaProps={{ rows: 3 }}
							/>
						</Stack>
					</Card>

					{/* Notifications card */}
					<Card
						header={
							<HStack gap={2}>
								<Bell size={18} />
								<Heading size="sm">Notifications</Heading>
							</HStack>
						}
					>
						<Stack gap={4}>
							<Text fontSize="sm" color="fg.muted">
								Choose how often you receive email notifications about activity
								in your account.
							</Text>
							<SelectField<SettingsFormValues>
								name="notificationFrequency"
								label="Email frequency"
							>
								<option value="immediately">Immediately</option>
								<option value="daily">Daily Digest</option>
								<option value="weekly">Weekly</option>
								<option value="never">Never</option>
							</SelectField>
						</Stack>
					</Card>

					{/* Security card */}
					<Card
						header={
							<HStack gap={2}>
								<Shield size={18} />
								<Heading size="sm">Security</Heading>
							</HStack>
						}
					>
						<Stack gap={4}>
							<Text fontSize="sm" color="fg.muted">
								Update your password to keep your account secure. Leave these
								fields blank if you don't want to change it.
							</Text>
							<InputField<SettingsFormValues>
								name="currentPassword"
								label="Current password"
								placeholder="Enter current password"
								type="password"
							/>
							<InputField<SettingsFormValues>
								name="newPassword"
								label="New password"
								placeholder="Enter new password"
								type="password"
							/>
						</Stack>
					</Card>

					{/* Footer actions */}
					<Box>
						<Separator mb={6} />
						<Flex justify="flex-end" gap={3}>
							{saved && (
								<Text
									fontSize="sm"
									color="fg.success"
									alignSelf="center"
									mr={2}
								>
									Changes saved successfully.
								</Text>
							)}
							<Button variant="outline" onClick={handleCancel}>
								Cancel
							</Button>
							<Button variant="solid" onClick={handleSaveClick}>
								Save changes
							</Button>
						</Flex>
					</Box>
				</Stack>

				{/* Confirmation modal */}
				<Modal
					open={confirmOpen}
					onClose={() => setConfirmOpen(false)}
					header="Save changes?"
					onSave={handleConfirmSave}
					saveLabel="Save"
					cancelLabel="Cancel"
					size="sm"
				>
					<Text fontSize="sm" color="fg.muted">
						Your profile, notification preferences, and any password changes
						will be updated. This action cannot be undone automatically.
					</Text>
				</Modal>
			</Box>
		</FormProvider>
	);
}

const meta = {
	title: "Showcase/Settings Page",
	parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <SettingsPageDemo />,
};
