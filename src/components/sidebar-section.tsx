import { Box, Flex, Text } from "@chakra-ui/react";
import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { IconButton } from "../atoms/button";

export interface SidebarSectionProps {
	label: string;
	children:
		| React.ReactNode
		| ((state: {
				isEditing: boolean;
				setEditing: (v: boolean) => void;
		  }) => React.ReactNode);
	actionIcon?: React.ReactNode;
	onAction?: () => void;
	editContent?: React.ReactNode;
	emptyText?: string;
	defaultEditing?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
	label,
	children,
	actionIcon,
	onAction,
	editContent,
	emptyText,
	defaultEditing,
}) => {
	const [isEditing, setEditing] = useState(defaultEditing ?? false);

	const hasActionButton = Boolean(actionIcon && (onAction || editContent));

	const handleActionClick = () => {
		if (onAction) {
			onAction();
		} else if (editContent) {
			setEditing((prev) => !prev);
		}
	};

	const resolvedIcon =
		isEditing && !onAction && editContent ? <X size={14} /> : actionIcon;

	let content: React.ReactNode;
	if (typeof children === "function") {
		content = children({ isEditing, setEditing });
	} else if (isEditing && editContent) {
		content = editContent;
	} else {
		content = children;
	}

	const isEmpty =
		content === null ||
		content === undefined ||
		content === "" ||
		content === false;

	return (
		<Box py={3}>
			<Flex justify="space-between" align="center">
				<Text
					fontSize="xs"
					fontWeight="semibold"
					color="fg.muted"
					textTransform="uppercase"
					letterSpacing="wide"
				>
					{label}
				</Text>
				{hasActionButton && (
					<IconButton
						aria-label={isEditing && !onAction ? "Cancel edit" : label}
						size="xs"
						variant="ghost"
						onClick={handleActionClick}
					>
						{resolvedIcon}
					</IconButton>
				)}
			</Flex>
			<Box py={2}>
				{isEmpty && emptyText ? (
					<Text fontSize="sm" color="fg.subtle">
						{emptyText}
					</Text>
				) : (
					content
				)}
			</Box>
		</Box>
	);
};

SidebarSection.displayName = "SidebarSection";
