import type { Meta, StoryObj } from "@storybook/react";
import { Users } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Avatar } from "../../primitives";
import { Box, HStack, Stack } from "../../primitives/layout";
import { Composer } from "./composer";
import type { ComposerMentionProps } from "./types";

/**
 * Mixed referable kinds — the dropdown renders whatever the injected
 * callback returns; anker never knows what a "member" or "team" is.
 */
type Referable =
	| { kind: "member"; id: string; name: string }
	| { kind: "team"; id: string; name: string; memberCount: number };

const REFERABLES: Referable[] = [
	{ kind: "member", id: "u1", name: "Ada Lovelace" },
	{ kind: "member", id: "u2", name: "Grace Hopper" },
	{ kind: "member", id: "u3", name: "Annie Easley" },
	{ kind: "member", id: "u4", name: "Margaret Hamilton" },
	{ kind: "team", id: "t1", name: "Platform Team", memberCount: 6 },
	{ kind: "team", id: "t2", name: "Support Team", memberCount: 11 },
];

const renderReferable = (item: Referable) =>
	item.kind === "member" ? (
		<HStack gap="2">
			<Avatar name={item.name} size="2xs" />
			<span>{item.name}</span>
		</HStack>
	) : (
		<HStack gap="2" color="muted">
			<Users size={16} aria-hidden />
			<Box as="span" color="default">
				{item.name}
			</Box>
			<span>{item.memberCount} members</span>
		</HStack>
	);

/** The injected suggestion source — a stand-in for messengerhub's member search. */
const searchReferables = (query: string) =>
	REFERABLES.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

function useDemoMention(
	onPicked?: (item: Referable) => void,
): ComposerMentionProps<Referable> {
	return useMemo(
		() => ({
			getSuggestions: searchReferables,
			getSuggestionKey: (r) => r.id,
			renderSuggestion: renderReferable,
			onSelect: (item) => {
				onPicked?.(item);
				return `@${item.name} `;
			},
		}),
		[onPicked],
	);
}

const meta = {
	title: "Components/Composer",
	component: Composer,
} satisfies Meta<typeof Composer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Composer />,
};

export const Filled: Story = {
	render: () => (
		<Composer defaultValue="The fixture conversation renders correctly on my end — dividers, anchoring, the lot." />
	),
};

/** Consumers use `disabled` for archived or read-only conversations. */
export const Disabled: Story = {
	render: () => (
		<Composer disabled defaultValue="This conversation is archived." />
	),
};

/**
 * Typing `@` opens the dropdown with whatever the injected callback returns —
 * here a mix of members and teams. Arrow keys move the highlight, Enter/Tab
 * select, Escape dismisses. Selecting inserts `@Name ` and logs the pick.
 */
function MentionHarness() {
	const [picked, setPicked] = useState<string[]>([]);
	const onPicked = useCallback((item: Referable) => {
		setPicked((current) => [...current, `${item.kind}: ${item.name}`]);
	}, []);
	const mention = useDemoMention(onPicked);
	return (
		<Stack gap="3">
			<Composer mention={mention} />
			<Box fontSize="sm" color="muted">
				{picked.length === 0
					? "Type @ to mention — selections appear here."
					: `Selected → ${picked.join(", ")}`}
			</Box>
		</Stack>
	);
}

export const MentionAutocomplete: Story = {
	render: () => <MentionHarness />,
	play: async ({ canvasElement }) => {
		// Pre-type "@a" so the dropdown is open on load. Write through the
		// native setter so React's onChange sees the value.
		const textarea = canvasElement.querySelector<HTMLTextAreaElement>(
			".composer__textarea",
		);
		if (!textarea) return;
		textarea.focus();
		const setValue = Object.getOwnPropertyDescriptor(
			HTMLTextAreaElement.prototype,
			"value",
		)?.set;
		setValue?.call(textarea, "@a");
		textarea.setSelectionRange(2, 2);
		textarea.dispatchEvent(new Event("input", { bubbles: true }));
	},
};

/**
 * The composer never sends or signals anything itself — it only fires
 * callbacks. This harness wires them to a visible log: onSubmit appends a
 * message, onInputActivity is throttled into a typing signal (the consumer's
 * job — messengerhub would emit it over its socket).
 */
function CallbackHarness() {
	const [messages, setMessages] = useState<string[]>([]);
	const [typing, setTyping] = useState(false);
	const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
	const onInputActivity = useCallback(() => {
		setTyping(true);
		clearTimeout(typingTimeout.current);
		typingTimeout.current = setTimeout(() => setTyping(false), 1200);
	}, []);
	const mention = useDemoMention();
	return (
		<Stack gap="3">
			<Box fontSize="sm" color="muted" minBlockSize="1.5em">
				{typing ? "Someone is typing…" : null}
			</Box>
			<Composer
				mention={mention}
				onSubmit={(text) => setMessages((current) => [...current, text])}
				onInputActivity={onInputActivity}
			/>
			<Stack gap="1" fontSize="sm">
				{messages.map((message, index) => (
					<Box
						// biome-ignore lint/suspicious/noArrayIndexKey: demo log, append-only
						key={index}
						paddingInline="3"
						paddingBlock="1"
						bg="bg-subtle"
						borderRadius="md"
					>
						{message}
					</Box>
				))}
			</Stack>
		</Stack>
	);
}

export const SubmitAndTypingSignals: Story = {
	render: () => <CallbackHarness />,
};
