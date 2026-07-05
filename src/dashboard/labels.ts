export interface DashboardLabels {
	edit: string;
	save: string;
	discard: string;
	addWidget: string;
	removeWidget: string;
	configureWidget: string;
	dragHandle: string;
	catalogTitle: string;
	configTitle: string;
	emptyHeader: string;
	emptyDescription: string;
	unknownWidget: string;
	noAccessWidget: string;
}

export const defaultDashboardLabels: DashboardLabels = {
	edit: "Edit",
	save: "Save",
	discard: "Discard",
	addWidget: "Add widget",
	removeWidget: "Remove widget",
	configureWidget: "Configure widget",
	dragHandle: "Drag to move",
	catalogTitle: "Add a widget",
	configTitle: "Configure widget",
	emptyHeader: "No widgets yet",
	emptyDescription: "Enter edit mode and add a widget to get started.",
	unknownWidget: "Unknown widget",
	noAccessWidget: "You don't have access to this widget.",
};
