import type React from "react";
import { Badge } from "../../../primitives/badge";
import { HStack, VStack } from "../../../primitives/layout";
import { Tooltip } from "../../../primitives/tooltip";
import { Text } from "../../../primitives/typography";
import { emptyCellValue } from "./cell-utils";
import { formatUserAgent } from "./user-agent";

export interface DeviceCellProps {
	/** Raw User-Agent string. Null/empty renders the empty cell value. */
	userAgent: string | null | undefined;
	/** Optional badge displayed to the right of the primary line (e.g. "Current"). */
	badge?: { label: string; colorPalette?: string };
}

export const DeviceCell: React.FC<DeviceCellProps> = ({ userAgent, badge }) => {
	if (userAgent == null || userAgent === "") {
		return <span>{emptyCellValue}</span>;
	}
	const label = formatUserAgent(userAgent);
	return (
		<Tooltip content={userAgent} showArrow>
			<VStack align="start" gap={0}>
				<HStack gap={2} align="center">
					<Text fontSize="sm" fontWeight="medium" lineClamp={1}>
						{label}
					</Text>
					{badge && (
						<Badge colorPalette={badge.colorPalette} size="xs">
							{badge.label}
						</Badge>
					)}
				</HStack>
				<Text fontSize="xs" color="fg.muted" lineClamp={1}>
					{userAgent}
				</Text>
			</VStack>
		</Tooltip>
	);
};
DeviceCell.displayName = "DeviceCell";
