import { useEffect, useRef, useState } from "react";
import type { DashboardMode, WidgetDefinition, WidgetInstance } from "./types";

export interface UseDashboardDraftArgs {
	widgets: WidgetInstance[];
	mode: DashboardMode;
	generateId: () => string;
	onDraftChange?: (draft: WidgetInstance[]) => void;
}

export interface DashboardDraft {
	items: WidgetInstance[];
	isDirty: boolean;
	getDraft(): WidgetInstance[];
	addWidget(def: WidgetDefinition): void;
	removeWidget(id: string): void;
	updateSettings(id: string, settings: Record<string, unknown>): void;
	updateLayouts(
		layouts: Array<{ i: string; x: number; y: number; w: number; h: number }>,
	): void;
}

function clone(widgets: WidgetInstance[]): WidgetInstance[] {
	return widgets.map((w) => ({
		...w,
		settings: { ...w.settings },
		layout: { ...w.layout },
	}));
}

function nextY(items: WidgetInstance[]): number {
	return items.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0);
}

export function useDashboardDraft({
	widgets,
	mode,
	generateId,
	onDraftChange,
}: UseDashboardDraftArgs): DashboardDraft {
	const [draft, setDraft] = useState<WidgetInstance[] | null>(null);
	const prevMode = useRef<DashboardMode>("view");

	useEffect(() => {
		if (mode === "edit" && prevMode.current !== "edit") {
			setDraft(clone(widgets));
		} else if (mode !== "edit") {
			setDraft(null);
		}
		prevMode.current = mode;
	}, [mode, widgets]);

	const editing = mode === "edit" && draft !== null;
	const items = editing ? (draft as WidgetInstance[]) : widgets;
	const isDirty = editing
		? JSON.stringify(draft) !== JSON.stringify(widgets)
		: false;

	const commit = (next: WidgetInstance[]) => {
		setDraft(next);
		onDraftChange?.(next);
	};

	return {
		items,
		isDirty,
		getDraft: () => draft ?? widgets,
		addWidget: (def) => {
			const base = draft ?? widgets;
			const instance: WidgetInstance = {
				id: generateId(),
				type: def.type,
				settings: { ...(def.defaultSettings ?? {}) },
				layout: {
					x: 0,
					y: nextY(base),
					w: def.defaultSize.w,
					h: def.defaultSize.h,
				},
			};
			commit([...base, instance]);
		},
		removeWidget: (id) => commit((draft ?? widgets).filter((w) => w.id !== id)),
		updateSettings: (id, settings) =>
			commit(
				(draft ?? widgets).map((w) => (w.id === id ? { ...w, settings } : w)),
			),
		updateLayouts: (layouts) => {
			const byId = new Map(layouts.map((l) => [l.i, l]));
			commit(
				(draft ?? widgets).map((w) => {
					const l = byId.get(w.id);
					return l ? { ...w, layout: { x: l.x, y: l.y, w: l.w, h: l.h } } : w;
				}),
			);
		},
	};
}
