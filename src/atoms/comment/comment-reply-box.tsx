import { Box, Button, ButtonGroup, Flex, Textarea } from "@chakra-ui/react";
import type React from "react";
import { useRef, useState } from "react";

export interface CommentReplyBoxProps {
	onReply: (value: string) => Promise<void>;
	onCancel?: () => void;
	/** Placeholder text for the reply textarea */
	placeholder?: string;
	/** Label for the cancel button */
	cancelLabel?: string;
	/** Label for the reply/submit button */
	replyLabel?: string;
}

export const CommentReplyBox = ({
	ref,
	...props
}: CommentReplyBoxProps & { ref?: React.Ref<HTMLTextAreaElement> }) => {
	const {
		onReply,
		onCancel,
		placeholder = "Write a reply...",
		cancelLabel = "Cancel",
		replyLabel = "Reply",
	} = props;

	const textBoxRef = useRef<HTMLTextAreaElement>(null);

	const mergedRef = (node: HTMLTextAreaElement | null) => {
		(textBoxRef as React.MutableRefObject<HTMLTextAreaElement | null>).current =
			node;
		if (typeof ref === "function") {
			ref(node);
		} else if (ref) {
			(ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
				node;
		}
	};

	const [isFocused, setIsFocused] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [value, setValue] = useState<string>("");

	const handleReply = async (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!value || !value.trim() || value === "") {
			return;
		}
		try {
			setIsSubmitting(true);
			await onReply?.(value);
			setValue("");
			setIsFocused(false);
		} catch (e) {
			console.error(e);
		}

		setIsSubmitting(false);
	};

	const handleCancel = () => {
		setValue("");
		setIsFocused(false);
		onCancel?.();
	};

	return (
		<Box w="full" onFocus={() => setIsFocused(true)}>
			<form onSubmit={handleReply}>
				<Textarea
					value={String(value)}
					onChange={(e) => setValue(e.target.value)}
					minH={isFocused ? undefined : "2.5rem"}
					placeholder={placeholder}
					ref={mergedRef}
					onKeyDown={(e) => {
						// modifier + enter
						if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
							handleReply(e);
						}
					}}
					disabled={isSubmitting}
				/>

				<Flex
					mt={2}
					display={isFocused ? "flex" : "none"}
					justifyContent="flex-end"
				>
					<ButtonGroup marginInlineStart="auto" size="sm">
						<Button
							variant="outline"
							loading={isSubmitting}
							onClick={handleCancel}
						>
							{cancelLabel}
						</Button>
						<Button type="submit" variant="solid" loading={isSubmitting}>
							{replyLabel}
						</Button>
					</ButtonGroup>
				</Flex>
			</form>
		</Box>
	);
};
CommentReplyBox.displayName = "CommentReplyBox";
