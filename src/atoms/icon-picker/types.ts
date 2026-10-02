/**
 * The tag and category data the picker searches, generated from lucide's own
 * metadata by `scripts/generate-lucide-metadata.ts` and loaded on demand.
 */
export interface LucideMetadata {
	/** The lucide version the data was generated from. */
	version: string;
	/** `[id, title]`, sorted by title — the category chips. */
	categories: ReadonlyArray<readonly [id: string, title: string]>;
	/** `[name, tags, categoryIds]` for every icon lucide-react can load. */
	icons: ReadonlyArray<
		readonly [
			name: string,
			tags: readonly string[],
			categories: readonly string[],
		]
	>;
}

/** One icon as the picker sees it. */
export interface IconEntry {
	/** The lucide name — the value the picker stores (`"file-text"`). */
	name: string;
	/** lowercase search terms: lucide's tags plus the icon's former names. */
	tags: readonly string[];
	/** lucide category ids (`"files"`, `"money"`). */
	categories: readonly string[];
}

/** User-facing strings. Every one has an English default. */
export interface IconPickerLabels {
	/** Trigger text when no icon is chosen. @default "Choose an icon" */
	placeholder: string;
	/** Search box placeholder and accessible name. @default "Search icons" */
	search: string;
	/** Accessible name of the clear button. @default "Clear icon" */
	clear: string;
	/** Accessible name of the icon grid. @default "Icons" */
	grid: string;
	/** Accessible name of the category chip group. @default "Categories" */
	categories: string;
	/** The chip that removes the category filter. @default "All" */
	allCategories: string;
	/** Heading of the recently-used row. @default "Recently used" */
	recent: string;
	/** Heading above the full set when the recent row shows. @default "All icons" */
	allIcons: string;
	/** Shown when nothing matches. @default "No icons match" */
	noResults: string;
}
