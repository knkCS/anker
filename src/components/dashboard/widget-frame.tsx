import { GripVertical, Settings, X } from "lucide-react";
import type React from "react";
import { IconButton } from "../../atoms/button";
import { Box, Flex, HStack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { Widget } from "../widget";
import type { DashboardLabels } from "./labels";
import { resolveWidgetSettings } from "./resolve-settings";
import type { DashboardMode, WidgetDefinition, WidgetInstance } from "./types";

export interface WidgetFrameProps {
	definition?: WidgetDefinition;
	instance: WidgetInstance;
	mode: DashboardMode;
	labels: DashboardLabels;
	available?: boolean;
	onConfigure?: (id: string) => void;
	onRemove?: (id: string) => void;
}

export const WidgetFrame: React.FC<WidgetFrameProps> = ({
	definition,
	instance,
	mode,
	labels,
	available,
	onConfigure,
	onRemove,
}) => {
	const editing = mode === "edit";
	const configurable =
		!!definition &&
		available !== false &&
		(!!definition.settingsSchema?.length || !!definition.ConfigEditor);

	return (
		<Box position="relative" height="100%">
			{editing && (
				<Flex
					className="rgl-drag-handle"
					align="center"
					justify="space-between"
					cursor="grab"
					bg="bg-subtle"
					borderBottom="1px solid"
					borderColor="border"
					paddingInline={2}
					paddingBlock={1}
				>
					<Box color="subtle" role="img" aria-label={labels.dragHandle}>
						<GripVertical size={16} aria-hidden />
					</Box>
					<HStack
						className="rgl-no-drag"
						onMouseDown={(e) => e.stopPropagation()}
					>
						{configurable && (
							<IconButton
								size="sm"
								variant="ghost"
								aria-label={labels.configureWidget}
								onClick={() => onConfigure?.(instance.id)}
							>
								<Settings size={16} />
							</IconButton>
						)}
						<IconButton
							size="sm"
							variant="ghost"
							aria-label={labels.removeWidget}
							onClick={() => onRemove?.(instance.id)}
						>
							<X size={16} />
						</IconButton>
					</HStack>
				</Flex>
			)}

			{definition ? (
				<Widget heading={definition.name} icon={definition.icon}>
					{available === false ? (
						<Text fontSize="sm" color="muted">
							{labels.noAccessWidget}
						</Text>
					) : (
						<definition.Component
							id={instance.id}
							settings={resolveWidgetSettings(definition, instance)}
							mode={mode}
						/>
					)}
				</Widget>
			) : (
				<Widget heading={labels.unknownWidget} icon={null}>
					<Text fontSize="sm" color="muted">
						{instance.type}
					</Text>
				</Widget>
			)}
		</Box>
	);
};
WidgetFrame.displayName = "WidgetFrame";
