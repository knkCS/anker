// src/components/toolbar.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { KeyRound, ShieldCheck, UserCircle } from "lucide-react";
import { useState } from "react";
import { Toolbar } from "./toolbar";

const meta = {
	title: "Components/Toolbar",
	component: Toolbar,
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => {
		const [q, setQ] = useState("");
		const [role, setRole] = useState(false);
		return (
			<Toolbar>
				<Toolbar.Search
					placeholder="Search by name or email…"
					value={q}
					onChange={setQ}
				/>
				<Toolbar.Filters>
					<Toolbar.FilterChip
						icon={<UserCircle size={14} />}
						active={role}
						onClick={() => setRole((v) => !v)}
					>
						Role
					</Toolbar.FilterChip>
					<Toolbar.FilterChip icon={<KeyRound size={14} />} onClick={() => {}}>
						Application
					</Toolbar.FilterChip>
					<Toolbar.FilterChip
						icon={<ShieldCheck size={14} />}
						onClick={() => {}}
					>
						2FA
					</Toolbar.FilterChip>
				</Toolbar.Filters>
				<Toolbar.Right>
					<Toolbar.Count>7 of 12</Toolbar.Count>
				</Toolbar.Right>
			</Toolbar>
		);
	},
};
