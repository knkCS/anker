import { Table } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { Download, Inbox, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "../../atoms/button/button";
import { EmptyState } from "../../atoms/empty-state/empty-state";
import { Persona } from "../../atoms/persona/persona";
import { SearchInput } from "../../atoms/search-input/search-input";
import { StatusBadge } from "../../atoms/status-badge/status-badge";
import { Card } from "../../components/card";
import { DrawerRoot } from "../../components/drawer";
import { Pagination } from "../../components/pagination";
import { InputField } from "../../forms/input-field";
import { SelectField } from "../../forms/select-field";
import { Box, Flex, HStack, Stack } from "../../primitives/layout";
import { Separator } from "../../primitives/separator";
import { Heading, Text } from "../../primitives/typography";

// ------------------------------------------------------------------ types ---

interface TeamMember {
	id: number;
	name: string;
	email: string;
	role: string;
	status: string;
	department: string;
}

interface EditFormValues {
	name: string;
	email: string;
	role: string;
}

// ----------------------------------------------------------------- data ----

const STATUS_COLORS: Record<string, string> = {
	Active: "#22c55e",
	Inactive: "#94a3b8",
	Pending: "#f59e0b",
	Suspended: "#ef4444",
};

const MOCK_DATA: TeamMember[] = [
	{
		id: 1,
		name: "Alice Müller",
		email: "alice.mueller@example.com",
		role: "Admin",
		status: "Active",
		department: "Engineering",
	},
	{
		id: 2,
		name: "Bob Tanaka",
		email: "bob.tanaka@example.com",
		role: "Editor",
		status: "Active",
		department: "Marketing",
	},
	{
		id: 3,
		name: "Clara Santos",
		email: "clara.santos@example.com",
		role: "Viewer",
		status: "Pending",
		department: "Design",
	},
	{
		id: 4,
		name: "David Okafor",
		email: "david.okafor@example.com",
		role: "Editor",
		status: "Active",
		department: "Engineering",
	},
	{
		id: 5,
		name: "Eva Lindström",
		email: "eva.lindstrom@example.com",
		role: "Admin",
		status: "Inactive",
		department: "Product",
	},
	{
		id: 6,
		name: "Faisal Al-Amin",
		email: "faisal.alamin@example.com",
		role: "Viewer",
		status: "Active",
		department: "Support",
	},
	{
		id: 7,
		name: "Grace Kim",
		email: "grace.kim@example.com",
		role: "Editor",
		status: "Active",
		department: "Marketing",
	},
	{
		id: 8,
		name: "Hugo Ferreira",
		email: "hugo.ferreira@example.com",
		role: "Viewer",
		status: "Suspended",
		department: "Design",
	},
	{
		id: 9,
		name: "Ingrid Hoffmann",
		email: "ingrid.hoffmann@example.com",
		role: "Editor",
		status: "Pending",
		department: "Engineering",
	},
	{
		id: 10,
		name: "James Osei",
		email: "james.osei@example.com",
		role: "Viewer",
		status: "Active",
		department: "Support",
	},
	{
		id: 11,
		name: "Keiko Yamamoto",
		email: "keiko.yamamoto@example.com",
		role: "Admin",
		status: "Active",
		department: "Product",
	},
	{
		id: 12,
		name: "Luca Bianchi",
		email: "luca.bianchi@example.com",
		role: "Editor",
		status: "Inactive",
		department: "Engineering",
	},
	{
		id: 13,
		name: "Mia Petrova",
		email: "mia.petrova@example.com",
		role: "Viewer",
		status: "Active",
		department: "Marketing",
	},
	{
		id: 14,
		name: "Nour Khalil",
		email: "nour.khalil@example.com",
		role: "Editor",
		status: "Pending",
		department: "Design",
	},
	{
		id: 15,
		name: "Oscar Bergström",
		email: "oscar.bergstrom@example.com",
		role: "Viewer",
		status: "Active",
		department: "Support",
	},
];

const PAGE_SIZE = 5;

// ------------------------------------------------------------ component ----

function DataManagementDemo() {
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const methods = useForm<EditFormValues>({
		defaultValues: { name: "", email: "", role: "" },
	});

	// Filter
	const filtered = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return MOCK_DATA;
		return MOCK_DATA.filter(
			(m) =>
				m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
		);
	}, [searchQuery]);

	// Reset to page 1 whenever filter changes
	const handleSearch = (q: string) => {
		setSearchQuery(q);
		setCurrentPage(1);
	};

	// Paginate
	const paginated = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return filtered.slice(start, start + PAGE_SIZE);
	}, [filtered, currentPage]);

	// Edit drawer
	function openEditDrawer(member: TeamMember) {
		setSelectedMember(member);
		methods.reset({
			name: member.name,
			email: member.email,
			role: member.role,
		});
		setDrawerOpen(true);
	}

	function handleDrawerClose() {
		setDrawerOpen(false);
		setSelectedMember(null);
	}

	function handleSave() {
		// In a real app this would submit to an API
		setDrawerOpen(false);
		setSelectedMember(null);
	}

	return (
		<Box maxW="1000px" mx="auto" py={8} px={4}>
			{/* Page header */}
			<Flex
				justify="space-between"
				align="flex-start"
				mb={6}
				gap={4}
				wrap="wrap"
			>
				<Stack gap={1}>
					<Heading size="xl">Team Members</Heading>
					<Text color="fg.muted" fontSize="sm">
						Manage your organisation's team members, roles, and access.
					</Text>
				</Stack>
				<HStack gap={2}>
					<Button variant="outline">
						<Download size={16} />
						Export
					</Button>
					<Button variant="solid">
						<Plus size={16} />
						Add Member
					</Button>
				</HStack>
			</Flex>

			<Card>
				{/* Toolbar */}
				<Box mb={4}>
					<Flex gap={4} align="center" justify="space-between" wrap="wrap">
						<SearchInput
							onSearch={handleSearch}
							placeholder="Search by name or email…"
							maxWidth="320px"
						/>
						<Text fontSize="sm" color="fg.muted">
							{filtered.length === MOCK_DATA.length
								? `${MOCK_DATA.length} members`
								: `${filtered.length} of ${MOCK_DATA.length} members`}
						</Text>
					</Flex>
				</Box>

				<Separator mb={4} />

				{/* Table / Empty state */}
				{paginated.length === 0 ? (
					<EmptyState
						icon={<Inbox size={40} color="var(--chakra-colors-fg-muted)" />}
						header="No members found"
						description={`No results for "${searchQuery}". Try a different name or email.`}
					/>
				) : (
					<>
						<Table.Root size="sm" variant="line">
							<Table.Header>
								<Table.Row>
									<Table.ColumnHeader>Name</Table.ColumnHeader>
									<Table.ColumnHeader>Email</Table.ColumnHeader>
									<Table.ColumnHeader>Role</Table.ColumnHeader>
									<Table.ColumnHeader>Department</Table.ColumnHeader>
									<Table.ColumnHeader>Status</Table.ColumnHeader>
									<Table.ColumnHeader width="80px" />
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{paginated.map((member) => (
									<Table.Row key={member.id}>
										<Table.Cell>
											<Persona name={member.name} size="xs" />
										</Table.Cell>
										<Table.Cell>
											<Text fontSize="sm" color="fg.muted">
												{member.email}
											</Text>
										</Table.Cell>
										<Table.Cell>
											<Text fontSize="sm">{member.role}</Text>
										</Table.Cell>
										<Table.Cell>
											<Text fontSize="sm">{member.department}</Text>
										</Table.Cell>
										<Table.Cell>
											<StatusBadge
												label={member.status}
												color={STATUS_COLORS[member.status] ?? "#94a3b8"}
											/>
										</Table.Cell>
										<Table.Cell>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => openEditDrawer(member)}
											>
												Edit
											</Button>
										</Table.Cell>
									</Table.Row>
								))}
							</Table.Body>
						</Table.Root>

						{/* Pagination */}
						<Flex
							justify="flex-end"
							mt={4}
							pt={4}
							borderTop="1px solid"
							borderColor="border"
						>
							<Pagination
								page={currentPage}
								total={filtered.length}
								pageSize={PAGE_SIZE}
								onPageChange={setCurrentPage}
							/>
						</Flex>
					</>
				)}
			</Card>

			{/* Edit drawer */}
			<FormProvider {...methods}>
				<DrawerRoot
					open={drawerOpen}
					onClose={handleDrawerClose}
					title={
						selectedMember ? `Edit — ${selectedMember.name}` : "Edit Member"
					}
					onSave={methods.handleSubmit(handleSave)}
					saveLabel="Save changes"
				>
					<Stack gap={4} pt={2}>
						<InputField<EditFormValues>
							name="name"
							label="Full name"
							placeholder="Full name"
						/>
						<InputField<EditFormValues>
							name="email"
							label="Email address"
							placeholder="user@example.com"
							type="email"
						/>
						<SelectField<EditFormValues> name="role" label="Role">
							<option value="Admin">Admin</option>
							<option value="Editor">Editor</option>
							<option value="Viewer">Viewer</option>
						</SelectField>
					</Stack>
				</DrawerRoot>
			</FormProvider>
		</Box>
	);
}

// ----------------------------------------------------------------- story ---

const meta = {
	title: "Showcase/Data Management",
	parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <DataManagementDemo />,
};
