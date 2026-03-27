import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Stack } from "../primitives/layout";
import { Text } from "../primitives/typography";
import { Pagination } from "./pagination";

const meta = {
	title: "Components/Pagination",
	component: Pagination,
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

const DefaultDemo = () => {
	const [page, setPage] = useState(1);
	return (
		<Stack gap={2} alignItems="center">
			<Pagination
				page={page}
				total={100}
				pageSize={10}
				onPageChange={setPage}
			/>
			<Text fontSize="sm" color="muted">
				Page {page} of 10
			</Text>
		</Stack>
	);
};

export const Default: Story = {
	render() {
		return <DefaultDemo />;
	},
};

const FewPagesDemo = () => {
	const [page, setPage] = useState(1);
	return (
		<Pagination page={page} total={30} pageSize={10} onPageChange={setPage} />
	);
};

export const FewPages: Story = {
	render() {
		return <FewPagesDemo />;
	},
};

const ManyPagesDemo = () => {
	const [page, setPage] = useState(5);
	return (
		<Pagination page={page} total={500} pageSize={10} onPageChange={setPage} />
	);
};

export const ManyPages: Story = {
	render() {
		return <ManyPagesDemo />;
	},
};

const CustomPageSizeDemo = () => {
	const [page, setPage] = useState(1);
	return (
		<Stack gap={2} alignItems="center">
			<Pagination
				page={page}
				total={250}
				pageSize={25}
				onPageChange={setPage}
			/>
			<Text fontSize="sm" color="muted">
				Showing 25 items per page
			</Text>
		</Stack>
	);
};

export const CustomPageSize: Story = {
	render() {
		return <CustomPageSizeDemo />;
	},
};
