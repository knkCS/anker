import { chakra, useFieldContext, useSlotRecipe } from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, X } from "lucide-react";
import type React from "react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Popover,
	PopoverBody,
	PopoverContent,
	PopoverTrigger,
} from "../../primitives/popover";
import { IconButton } from "../button";
import { DynamicIcon } from "./dynamic-icon";
import { buildGridLayout, type GridLayout, moveActive } from "./grid-layout";
import {
	BARE_ENTRIES,
	type IconCatalog,
	isIconName,
	loadIconCatalog,
} from "./lucide-icons";
import {
	DEFAULT_RECENT_STORAGE_KEY,
	pushRecent,
	readRecent,
	writeRecent,
} from "./recent-icons";
import { searchIcons } from "./search-icons";
import type { IconPickerLabels } from "./types";

// Grid geometry — mirrored in the `iconPicker` recipe (44px cells, 4px gaps).
// The virtualiser positions rows by these numbers, so change them together.
const COLUMNS = 8;
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 28;

export const DEFAULT_ICON_PICKER_LABELS: IconPickerLabels = {
	placeholder: "Choose an icon",
	search: "Search icons",
	clear: "Clear icon",
	grid: "Icons",
	categories: "Categories",
	allCategories: "All",
	recent: "Recently used",
	allIcons: "All icons",
	noResults: "No icons match",
};

export interface IconPickerProps {
	/** The chosen lucide name (`"file-text"`), or null/undefined for none. */
	value: string | null | undefined;
	/** Called with the picked lucide name, or null when cleared. */
	onChange: (name: string | null) => void;
	/** Called when the picker is left — on the trigger's blur, or as the popover closes. */
	onBlur?: () => void;
	/** Offer a button that empties the value. @default true */
	isClearable?: boolean;
	disabled?: boolean;
	/** Shows the value but does not open or clear. */
	readOnly?: boolean;
	/** Marks the trigger invalid. Inside a Chakra `Field` it follows the field. */
	invalid?: boolean;
	/** The trigger's id — what a `<label htmlFor>` points at. */
	id?: string;
	/** A name for the hidden input that carries the value in a native form post. */
	name?: string;
	/** User-facing strings; each defaults to English. */
	labels?: Partial<IconPickerLabels>;
	/**
	 * localStorage key for the recently-used row. Share a key across pickers
	 * to share their history; pass null to keep no history.
	 * @default "anker:icon-picker:recent"
	 */
	recentStorageKey?: string | null;
	/** How many recent icons to keep. @default 8 (one row) */
	maxRecent?: number;
	/** The chip text for a lucide category. Defaults to lucide's English title. */
	formatCategory?: (category: { id: string; title: string }) => string;
	"aria-describedby"?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Chooses a lucide icon and stores its name. A trigger shows the current
 * icon; its popover searches every icon lucide-react ships — by name and by
 * lucide's own tags ("money" finds `banknote`) — filters by lucide's
 * categories, and remembers recent picks in the browser.
 *
 * Nothing heavy is bundled: the panel mounts only while open, each icon is
 * imported on demand as its row scrolls into view, and the tag/category data
 * is a generated module fetched the first time a picker opens.
 */
export const IconPicker = ({
	value,
	onChange,
	onBlur,
	isClearable = true,
	disabled = false,
	readOnly = false,
	invalid,
	id,
	name,
	labels: labelOverrides,
	recentStorageKey = DEFAULT_RECENT_STORAGE_KEY,
	maxRecent = COLUMNS,
	formatCategory,
	ref,
	...aria
}: IconPickerProps) => {
	const recipe = useSlotRecipe({ key: "iconPicker" });
	const styles = recipe();
	const field = useFieldContext();
	const labels = { ...DEFAULT_ICON_PICKER_LABELS, ...labelOverrides };
	const [open, setOpen] = useState(false);
	const valueId = useId();
	const isInvalid = invalid ?? field?.invalid ?? false;
	const hasValue = Boolean(value);

	const pick = useCallback(
		(picked: string) => {
			if (recentStorageKey) {
				writeRecent(
					recentStorageKey,
					pushRecent(readRecent(recentStorageKey), picked, maxRecent),
				);
			}
			onChange(picked);
			// A close driven by `open` never reaches onOpenChange, so the blur
			// that marks a form field touched is reported here.
			setOpen(false);
			onBlur?.();
		},
		[onChange, onBlur, recentStorageKey, maxRecent],
	);

	const describedBy =
		[valueId, aria["aria-describedby"]].filter(Boolean).join(" ") || undefined;

	return (
		<chakra.div css={styles.root} className="icon-picker">
			<Popover
				open={open}
				onOpenChange={(details) => {
					if (details.open && (disabled || readOnly)) return;
					setOpen(details.open);
					if (!details.open) onBlur?.();
				}}
				positioning={{ placement: "bottom-start" }}
				initialFocusEl={() =>
					document.getElementById(`${valueId}-search`) as HTMLElement | null
				}
				// The panel holds a search index and a virtual grid: build it on
				// open, tear it down on close (the CLAUDE-ANKER mount rule).
				lazyMount
				unmountOnExit
			>
				<PopoverTrigger asChild>
					<chakra.button
						ref={ref}
						type="button"
						id={id}
						css={styles.trigger}
						className="icon-picker__trigger"
						data-testid="icon-picker-trigger"
						disabled={disabled}
						data-readonly={readOnly || undefined}
						aria-invalid={isInvalid || undefined}
						aria-label={aria["aria-label"]}
						aria-labelledby={aria["aria-labelledby"]}
						// The trigger is named by its field label; the value rides
						// along as its description so it is still announced.
						aria-describedby={describedBy}
						onBlur={() => {
							if (!open) onBlur?.();
						}}
					>
						<DynamicIcon name={value} size={16} />
						<chakra.span
							id={valueId}
							css={styles.triggerLabel}
							data-placeholder={hasValue ? undefined : ""}
						>
							{hasValue ? value : labels.placeholder}
						</chakra.span>
						<ChevronDown size={16} aria-hidden="true" />
					</chakra.button>
				</PopoverTrigger>
				<PopoverContent width="auto">
					<PopoverBody padding={0}>
						<IconPickerPanel
							value={value ?? null}
							onPick={pick}
							labels={labels}
							searchId={`${valueId}-search`}
							recentStorageKey={recentStorageKey}
							formatCategory={formatCategory}
						/>
					</PopoverBody>
				</PopoverContent>
			</Popover>
			{isClearable && hasValue && !disabled && !readOnly && (
				<IconButton
					aria-label={labels.clear}
					variant="ghost"
					size="sm"
					onClick={() => onChange(null)}
				>
					<X size={16} aria-hidden="true" />
				</IconButton>
			)}
			{name && <input type="hidden" name={name} value={value ?? ""} />}
		</chakra.div>
	);
};
IconPicker.displayName = "IconPicker";

interface IconPickerPanelProps {
	value: string | null;
	onPick: (name: string) => void;
	labels: IconPickerLabels;
	searchId: string;
	recentStorageKey: string | null;
	formatCategory?: (category: { id: string; title: string }) => string;
}

function defaultActive(layout: GridLayout, value: string | null): number {
	if (layout.cells.length === 0) return -1;
	const chosen = value
		? layout.cells.findIndex((cell) => cell.name === value)
		: -1;
	return chosen >= 0 ? chosen : 0;
}

function IconPickerPanel({
	value,
	onPick,
	labels,
	searchId,
	recentStorageKey,
	formatCategory,
}: IconPickerPanelProps) {
	const recipe = useSlotRecipe({ key: "iconPicker" });
	const styles = recipe();
	const baseId = useId();
	const gridId = `${baseId}-grid`;
	const optionId = (index: number) => `${baseId}-option-${index}`;

	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string | null>(null);
	const [catalog, setCatalog] = useState<IconCatalog | null>(null);
	const [recent] = useState(() =>
		recentStorageKey ? readRecent(recentStorageKey).filter(isIconName) : [],
	);

	useEffect(() => {
		let live = true;
		loadIconCatalog().then(
			(loaded) => {
				if (live) setCatalog(loaded);
			},
			// Without the catalog the picker still searches names; the chips
			// simply don't appear.
			() => {},
		);
		return () => {
			live = false;
		};
	}, []);

	const entries = catalog?.entries ?? BARE_ENTRIES;
	const names = useMemo(
		() => searchIcons(entries, { query, category }),
		[entries, query, category],
	);
	const showRecent = !query.trim() && !category && recent.length > 0;
	const layout = useMemo(
		() =>
			buildGridLayout(
				showRecent
					? [
							{ key: "recent", title: labels.recent, names: recent },
							{ key: "all", title: labels.allIcons, names },
						]
					: [{ key: "all", names }],
				COLUMNS,
			),
		[showRecent, recent, names, labels.recent, labels.allIcons],
	);

	// The active index belongs to one layout: a new query or category starts
	// the cursor over, on the chosen icon if it is among the results.
	const [cursor, setCursor] = useState<{ layout: GridLayout; index: number }>(
		() => ({ layout, index: defaultActive(layout, value) }),
	);
	const active =
		cursor.layout === layout ? cursor.index : defaultActive(layout, value);
	const setActive = (index: number) => setCursor({ layout, index });
	const activeCell = layout.cells[active];

	const viewportRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const virtualizer = useVirtualizer({
		count: layout.rows.length,
		getScrollElement: () => viewportRef.current,
		estimateSize: (index) =>
			layout.rows[index]?.kind === "header" ? HEADER_HEIGHT : ROW_HEIGHT,
		getItemKey: (index) => layout.rows[index]?.key ?? index,
		overscan: 3,
	});

	// Keep the active option rendered (aria-activedescendant must point at a
	// real element) and in sight.
	const activeRow = activeCell?.row;
	useEffect(() => {
		if (activeRow !== undefined) {
			virtualizer.scrollToIndex(activeRow, { align: "auto" });
		}
	}, [activeRow, virtualizer]);

	const onKeyDown = (
		event: React.KeyboardEvent<HTMLElement>,
		fromSearch: boolean,
	) => {
		if (event.key === "Enter" || (!fromSearch && event.key === " ")) {
			if (activeCell) {
				event.preventDefault();
				onPick(activeCell.name);
			}
			return;
		}
		// In the search box Left/Right/Home/End belong to the caret.
		if (fromSearch && event.key !== "ArrowDown" && event.key !== "ArrowUp") {
			return;
		}
		const next = moveActive(layout, active, event.key);
		if (next === null) return;
		event.preventDefault();
		if (
			!fromSearch &&
			event.key === "ArrowUp" &&
			next === active &&
			activeCell
		) {
			// Up from the top row hands the keyboard back to the search box.
			searchRef.current?.focus();
			return;
		}
		setActive(next);
	};

	const chips = catalog
		? [
				{ id: null, label: labels.allCategories },
				...catalog.categories.map((c) => ({
					id: c.id as string | null,
					label: formatCategory ? formatCategory(c) : c.title,
				})),
			]
		: [];
	const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const onChipKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		const current = chips.findIndex((chip) => chip.id === category);
		const last = chips.length - 1;
		const next =
			event.key === "ArrowRight" || event.key === "ArrowDown"
				? Math.min(last, current + 1)
				: event.key === "ArrowLeft" || event.key === "ArrowUp"
					? Math.max(0, current - 1)
					: event.key === "Home"
						? 0
						: event.key === "End"
							? last
							: null;
		if (next === null) return;
		event.preventDefault();
		setCategory(chips[next].id);
		chipRefs.current[next]?.focus();
	};

	return (
		<chakra.div css={styles.panel} className="icon-picker__panel">
			<chakra.input
				ref={searchRef}
				id={searchId}
				css={styles.search}
				className="icon-picker__search"
				// The theme's input look, without depending on a wrapper that
				// would swallow the combobox attributes.
				paddingInline={3}
				minHeight="10"
				borderWidth="1px"
				borderColor="border"
				borderRadius="md"
				bg="bg-surface"
				fontSize="sm"
				_focusVisible={{ boxShadow: "focus-ring", outline: "none" }}
				type="search"
				role="combobox"
				aria-label={labels.search}
				placeholder={labels.search}
				aria-expanded="true"
				aria-controls={gridId}
				aria-autocomplete="list"
				aria-activedescendant={activeCell ? optionId(active) : undefined}
				autoComplete="off"
				spellCheck={false}
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				onKeyDown={(event) => onKeyDown(event, true)}
			/>
			{chips.length > 0 && (
				<chakra.div
					css={styles.chips}
					className="icon-picker__chips"
					role="radiogroup"
					aria-label={labels.categories}
					onKeyDown={onChipKeyDown}
				>
					{chips.map((chip, index) => {
						const checked = chip.id === category;
						return (
							<chakra.button
								key={chip.id ?? "all"}
								ref={(el: HTMLButtonElement | null) => {
									chipRefs.current[index] = el;
								}}
								type="button"
								role="radio"
								aria-checked={checked}
								// One tab stop for the whole strip; arrows move within it.
								tabIndex={checked ? 0 : -1}
								css={styles.chip}
								className="icon-picker__chip"
								onClick={() => setCategory(chip.id)}
							>
								{chip.label}
							</chakra.button>
						);
					})}
				</chakra.div>
			)}
			{layout.cells.length === 0 ? (
				<chakra.div css={styles.empty} role="status">
					{labels.noResults}
				</chakra.div>
			) : (
				<chakra.div
					ref={viewportRef}
					id={gridId}
					css={styles.viewport}
					className="icon-picker__viewport"
					role="listbox"
					aria-label={labels.grid}
					aria-activedescendant={activeCell ? optionId(active) : undefined}
					tabIndex={0}
					onKeyDown={(event) => onKeyDown(event, false)}
				>
					<chakra.div
						role="presentation"
						position="relative"
						width="100%"
						style={{ height: `${virtualizer.getTotalSize()}px` }}
					>
						{virtualizer.getVirtualItems().map((item) => {
							const row = layout.rows[item.index];
							if (!row) return null;
							return (
								<chakra.div
									key={item.key}
									role="presentation"
									position="absolute"
									top={0}
									insetInlineStart={0}
									width="100%"
									style={{
										height: `${item.size}px`,
										transform: `translateY(${item.start}px)`,
									}}
								>
									{row.kind === "header" ? (
										// A visual heading only: listbox children must be options,
										// and a virtual list cannot keep a group's members in one
										// wrapper.
										<chakra.div
											css={styles.header}
											height="100%"
											aria-hidden="true"
										>
											{row.title}
										</chakra.div>
									) : (
										<chakra.div css={styles.row} role="presentation">
											{row.cells.map((cell) => (
												<chakra.div
													key={cell.key}
													id={optionId(cell.index)}
													role="option"
													aria-selected={cell.name === value}
													aria-label={cell.name}
													title={cell.name}
													data-icon={cell.name}
													data-active={cell.index === active ? "" : undefined}
													css={styles.option}
													className="icon-picker__option"
													onClick={() => onPick(cell.name)}
													onPointerMove={() => {
														if (cell.index !== active) setActive(cell.index);
													}}
												>
													<DynamicIcon name={cell.name} size={20} />
												</chakra.div>
											))}
										</chakra.div>
									)}
								</chakra.div>
							);
						})}
					</chakra.div>
				</chakra.div>
			)}
		</chakra.div>
	);
}
