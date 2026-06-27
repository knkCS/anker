import type React from "react";
import { useMemo, useState } from "react";
import GridLayout, { WidthProvider } from "react-grid-layout/legacy";
import { EmptyState } from "../../atoms/empty-state";
import { Box } from "../../primitives/layout";
import { DrawerRoot } from "../drawer";
import { DashboardToolbar } from "./dashboard-toolbar";
import { type DashboardLabels, defaultDashboardLabels } from "./labels";
import type { WidgetRegistry } from "./registry";
import { resolveWidgetSettings } from "./resolve-settings";
import type {
	DashboardMode,
	GridConfig,
	WidgetDefinition,
	WidgetInstance,
} from "./types";
import { useDashboardDraft } from "./use-dashboard-draft";
import { WidgetCatalog } from "./widget-catalog";
import { WidgetConfigForm } from "./widget-config-form";
import { WidgetFrame } from "./widget-frame";

const ReactGridLayout = WidthProvider(GridLayout);

const DEFAULT_GRID: Required<GridConfig> = {
	cols: 12,
	rowHeight: 90,
	margin: [16, 16],
	containerPadding: [0, 0],
};

const GRID_CSS = {
	"& .react-grid-layout": {
		position: "relative",
		transition: "height 200ms ease",
	},
	"& .react-grid-item": {
		transition: "transform 200ms ease, width 200ms ease, height 200ms ease",
	},
	"& .react-grid-item.react-grid-placeholder": {
		background: "bg-accent-muted",
		borderRadius: "md",
		opacity: 0.4,
	},
	"& .react-grid-item > .react-resizable-handle": {
		position: "absolute",
		width: "20px",
		height: "20px",
		insetInlineEnd: 0,
		insetBlockEnd: 0,
		cursor: "se-resize",
	},
	"& .react-grid-item.react-resizable-hide > .react-resizable-handle": {
		display: "none",
	},
	"& .react-grid-item > .react-resizable-handle::after": {
		content: '""',
		position: "absolute",
		insetInlineEnd: "3px",
		insetBlockEnd: "3px",
		width: "6px",
		height: "6px",
		borderInlineEnd: "2px solid",
		borderBlockEnd: "2px solid",
		borderColor: "border",
	},
} as const;

let uidCounter = 0;
const defaultGenerateId = () =>
	`w-${Date.now().toString(36)}-${(uidCounter++).toString(36)}`;

export interface DashboardProps {
	registry: WidgetRegistry;
	widgets: WidgetInstance[];
	mode?: DashboardMode;
	grantedPermissions?: string[];
	availabilityContext?: unknown;
	grid?: GridConfig;
	onModeChange?: (mode: DashboardMode) => void;
	onCommit?: (widgets: WidgetInstance[]) => void;
	onDiscard?: () => void;
	onDraftChange?: (draft: WidgetInstance[]) => void;
	toolbar?: boolean;
	labels?: Partial<DashboardLabels>;
	emptyState?: React.ReactNode;
	generateId?: () => string;
}

const ConfigDrawer: React.FC<{
	title: string;
	saveLabel: string;
	def: WidgetDefinition;
	instance: WidgetInstance;
	onClose: () => void;
	onSave: (settings: Record<string, unknown>) => void;
}> = ({ title, saveLabel, def, instance, onClose, onSave }) => {
	const [settings, setSettings] = useState<Record<string, unknown>>(() =>
		resolveWidgetSettings(def, instance),
	);
	return (
		<DrawerRoot
			open
			onClose={onClose}
			title={title}
			saveLabel={saveLabel}
			onSave={() => onSave(settings)}
		>
			{def.ConfigEditor ? (
				<def.ConfigEditor settings={settings} onChange={setSettings} />
			) : (
				<WidgetConfigForm
					schema={def.settingsSchema ?? []}
					settings={settings}
					onChange={setSettings}
				/>
			)}
		</DrawerRoot>
	);
};
ConfigDrawer.displayName = "ConfigDrawer";

export const Dashboard: React.FC<DashboardProps> = ({
	registry,
	widgets,
	mode = "view",
	grantedPermissions,
	availabilityContext,
	grid,
	onModeChange,
	onCommit,
	onDiscard,
	onDraftChange,
	toolbar = true,
	labels: labelOverrides,
	emptyState,
	generateId = defaultGenerateId,
}) => {
	const labels = { ...defaultDashboardLabels, ...labelOverrides };
	const gridConfig = { ...DEFAULT_GRID, ...grid };
	const [catalogOpen, setCatalogOpen] = useState(false);
	const [configuringId, setConfiguringId] = useState<string | null>(null);

	const draft = useDashboardDraft({ widgets, mode, generateId, onDraftChange });
	const editing = mode === "edit";

	const layout = useMemo(
		() =>
			draft.items.map((it) => {
				const def = registry.get(it.type);
				return {
					i: it.id,
					x: it.layout.x,
					y: it.layout.y,
					w: it.layout.w,
					h: it.layout.h,
					minW: def?.minSize.w,
					minH: def?.minSize.h,
					maxW: def?.maxSize?.w,
					maxH: def?.maxSize?.h,
				};
			}),
		[draft.items, registry],
	);

	const configuring = configuringId
		? draft.items.find((w) => w.id === configuringId)
		: undefined;
	const configuringDef = configuring
		? registry.get(configuring.type)
		: undefined;

	const handleSave = () => {
		onCommit?.(draft.getDraft());
		onModeChange?.("view");
	};
	const handleDiscard = () => {
		onDiscard?.();
		onModeChange?.("view");
	};

	return (
		<Box>
			{toolbar && (
				<DashboardToolbar
					mode={mode}
					isDirty={draft.isDirty}
					labels={labels}
					onEdit={() => onModeChange?.("edit")}
					onAddWidget={() => setCatalogOpen(true)}
					onSave={handleSave}
					onDiscard={handleDiscard}
				/>
			)}

			{draft.items.length === 0 ? (
				(emptyState ?? (
					<EmptyState
						header={labels.emptyHeader}
						description={labels.emptyDescription}
					/>
				))
			) : (
				<Box css={GRID_CSS}>
					<ReactGridLayout
						className="layout"
						layout={layout}
						cols={gridConfig.cols}
						rowHeight={gridConfig.rowHeight}
						margin={gridConfig.margin}
						containerPadding={gridConfig.containerPadding}
						isDraggable={editing}
						isResizable={editing}
						draggableHandle=".rgl-drag-handle"
						draggableCancel=".rgl-no-drag"
						compactType="vertical"
						onLayoutChange={
							editing ? (l) => draft.updateLayouts([...l]) : undefined
						}
					>
						{draft.items.map((it) => (
							<div key={it.id}>
								<WidgetFrame
									definition={registry.get(it.type)}
									instance={it}
									mode={mode}
									labels={labels}
									onConfigure={setConfiguringId}
									onRemove={draft.removeWidget}
								/>
							</div>
						))}
					</ReactGridLayout>
				</Box>
			)}

			<WidgetCatalog
				open={catalogOpen}
				onClose={() => setCatalogOpen(false)}
				title={labels.catalogTitle}
				definitions={registry.getCatalog(
					grantedPermissions,
					availabilityContext,
				)}
				onSelect={draft.addWidget}
			/>

			{configuring && configuringDef && (
				<ConfigDrawer
					key={configuring.id}
					title={labels.configTitle}
					saveLabel={labels.save}
					def={configuringDef}
					instance={configuring}
					onClose={() => setConfiguringId(null)}
					onSave={(settings) => {
						draft.updateSettings(configuring.id, settings);
						setConfiguringId(null);
					}}
				/>
			)}
		</Box>
	);
};
Dashboard.displayName = "Dashboard";
