import { Pencil, Plus } from "lucide-react";
import type React from "react";
import { Button } from "../../atoms/button";
import { Flex, Spacer } from "../../primitives/layout";
import type { DashboardLabels } from "./labels";
import type { DashboardMode } from "./types";

export interface DashboardToolbarProps {
	mode: DashboardMode;
	isDirty: boolean;
	labels: DashboardLabels;
	onEdit: () => void;
	onAddWidget: () => void;
	onSave: () => void;
	onDiscard: () => void;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
	mode,
	isDirty,
	labels,
	onEdit,
	onAddWidget,
	onSave,
	onDiscard,
}) => {
	return (
		<Flex align="center" gap={2} paddingBlockEnd={4}>
			<Spacer />
			{mode === "view" ? (
				<Button variant="outline" size="sm" onClick={onEdit}>
					<Pencil size={16} /> {labels.edit}
				</Button>
			) : (
				<>
					<Button variant="outline" size="sm" onClick={onAddWidget}>
						<Plus size={16} /> {labels.addWidget}
					</Button>
					<Button variant="ghost" size="sm" onClick={onDiscard}>
						{labels.discard}
					</Button>
					<Button
						variant="solid"
						size="sm"
						onClick={onSave}
						disabled={!isDirty}
					>
						{labels.save}
					</Button>
				</>
			)}
		</Flex>
	);
};
DashboardToolbar.displayName = "DashboardToolbar";
