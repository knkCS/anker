import type React from "react";
import { Avatar } from "../../../primitives/avatar";
import { HStack, VStack } from "../../../primitives/layout";
import { Text } from "../../../primitives/typography";
import { emptyCellValue } from "./cell-utils";

export interface IdentityCellProps {
	/** Primary display name. Null/undefined renders the empty cell value. */
	name: string | null | undefined;
	/** Optional secondary line below the name (e.g., email, ID). */
	subText?: React.ReactNode;
	/** Avatar image source URL. */
	avatarSrc?: string;
	/** Initials shown as the avatar fallback. Auto-derived from `name` when omitted. */
	avatarFallback?: string;
	/** Avatar size; defaults to "sm" to match table density. */
	size?: "sm" | "md";
	/**
	 * Optional Chakra `colorPalette` forwarded to the underlying `Avatar`
	 * primitive (e.g. `"primary"`, `"secondary"`). Tints the fallback circle
	 * with the chosen palette. Omit for the default neutral-gray look.
	 */
	colorPalette?: string;
}

function deriveInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const IdentityCell: React.FC<IdentityCellProps> = ({
	name,
	subText,
	avatarSrc,
	avatarFallback,
	size = "sm",
	colorPalette,
}) => {
	if (name == null) return <span>{emptyCellValue}</span>;
	const initials = avatarFallback ?? deriveInitials(name);
	return (
		<HStack gap={2} align="center">
			<Avatar
				size={size}
				name={name}
				src={avatarSrc}
				fallback={initials}
				colorPalette={colorPalette}
			/>
			<VStack align="start" gap={0}>
				<Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
					{name}
				</Text>
				{subText != null && (
					<Text fontSize="xs" color="fg.muted" lineClamp={1}>
						{subText}
					</Text>
				)}
			</VStack>
		</HStack>
	);
};
IdentityCell.displayName = "IdentityCell";
