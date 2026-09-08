import {
	type ActionMeta,
	chakraComponents,
	type GroupBase,
	type InputActionMeta,
	type MenuListProps,
	type MenuProps,
	type MultiValue,
	type SingleValue,
} from "chakra-react-select";
import debounce from "lodash.debounce";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Text } from "../../primitives/typography";
import { BaseSelect, type BaseSelectProps } from "./base-select";
import type { BaseOption } from "./types";

/** One page of answers from a Source. */
export interface LookupPage<T extends BaseOption> {
	/** The items on this page, already in the order they should be offered. */
	items: T[];
	/**
	 * An opaque cursor for the page after this one — anything the Source can
	 * hand back to itself. Omit it (or pass `null`) to say there is no more.
	 */
	nextCursor?: string | null;
}

/** What a Source is asked for. */
export interface LookupSearchArgs {
	/** What the person has typed, after debouncing. Empty on the first open. */
	query: string;
	/** The page being asked for; absent means the first one. */
	cursor?: string;
	/**
	 * Aborted the moment this request stops being the one the menu is waiting
	 * for — a newer query, a next page, or the menu closing. Honour it and the
	 * request is cancelled; ignore it and its answer is discarded anyway.
	 */
	signal: AbortSignal;
}

/** What a resolver is asked for. */
export interface LookupResolveArgs {
	/** The stored ids that have no label yet. */
	ids: string[];
	/** Aborted when the value changes again before the answer arrives. */
	signal: AbortSignal;
}

/** Answers a query with one page of options. Required. */
export type LookupSearch<T extends BaseOption> = (
	args: LookupSearchArgs,
) => Promise<LookupPage<T>>;

/** Turns stored ids back into readable items. Optional. */
export type LookupResolve<T extends BaseOption> = (
	args: LookupResolveArgs,
) => Promise<T[]>;

/**
 * A stored value: the full item, or just its id. A full item is trusted as-is;
 * a bare id is looked up.
 */
export type LookupValue<T extends BaseOption> = T | string;

export interface LookupSelectProps<T extends BaseOption>
	extends Omit<
		BaseSelectProps<T>,
		// Owned by this control. Declaring one and then discarding it is the
		// defect ADR-0001 is about, so they are unreachable rather than ignored.
		// The `default*` three come from react-select's state manager and are
		// just as unhonourable here: `defaultInputValue` would show a query this
		// control never ran, `defaultValue` is dead because `value` is always
		// passed, and `defaultMenuIsOpen` would open a menu without opening it.
		| "components"
		| "defaultInputValue"
		| "defaultMenuIsOpen"
		| "defaultValue"
		| "filterOption"
		| "inputValue"
		| "loading"
		| "loadingMessage"
		| "noOptionsMessage"
		| "onChange"
		| "onInputChange"
		| "onMenuClose"
		| "onMenuOpen"
		| "onMenuScrollToBottom"
		| "options"
		| "value"
	> {
	/**
	 * The current selection. Full items are trusted; bare ids are resolved (or,
	 * with no resolver, displayed as themselves). An array when `isMulti`.
	 */
	value: LookupValue<T> | LookupValue<T>[] | null;
	/**
	 * The new selection: the item when single, the items when `isMulti`. Store
	 * the ids and hand them back as `value` — that is the round trip the
	 * resolver exists for.
	 */
	onChange?: (value: T | T[] | null) => void;
	/** The Source. Called only while the menu is open. */
	search: LookupSearch<T>;
	/**
	 * Turns stored ids into labels. Without it a stored id displays as itself,
	 * which is visibly degraded rather than blank.
	 */
	resolve?: LookupResolve<T>;
	/** How long typing settles before the Source is asked. @default 300 */
	debounceMs?: number;
	/** Shown when the Source answered with nothing. @default "No matches" */
	emptyMessage?: string;
	/** Shown when the Source failed. @default "Could not load options" */
	errorMessage?: string;
	/** Shown while the Source is answering. @default "Loading…" */
	loadingMessage?: string;
	/**
	 * Extra renderers, merged over the shared select's own. `Menu` and
	 * `MenuList` are not among them: the failure line and paging live there, so
	 * this control owns both.
	 */
	components?: Omit<
		NonNullable<BaseSelectProps<T>["components"]>,
		"Menu" | "MenuList"
	>;
}

/** How close to the end of the list counts as having reached it. */
const BOTTOM_THRESHOLD_PX = 24;

/**
 * Joins ids into one effect key. NUL rather than a space: an id is opaque and
 * may contain one, and a key that splits back into the wrong ids would ask the
 * resolver about things nobody stored. Written as an escape — a literal
 * control character in source is invisible to a reader and to grep.
 */
const ID_SEPARATOR = "\u0000";

interface LookupMenuState {
	failed: boolean;
	errorMessage: string;
	hasOptions: boolean;
	loadNextPage: () => void;
}

/**
 * What the menu renderers need from the control around them. A context rather
 * than a closure: these two components are defined once, at module scope, so
 * react-select never remounts an open menu (which would drop its scroll
 * position mid-page) — and rather than a ref mirror, which would mean writing
 * during render and reading state the components do not subscribe to.
 */
const LookupMenuContext = createContext<LookupMenuState>({
	failed: false,
	errorMessage: "",
	hasOptions: false,
	loadNextPage: () => {},
});

/**
 * The menu, plus the live region that reports a Source failure. It sits here
 * rather than inside `MenuList` because that element is the `role="listbox"`,
 * whose children must be options — an alert among them is announced
 * unreliably and may be exposed as a bogus choice.
 *
 * With no options to show, react-select's own notice slot carries the visible
 * message (that is what the slot is for, and the menu collapses entirely if it
 * renders nothing), so this one goes screen-reader-only to avoid saying it
 * twice. With options on screen there is no notice slot, so it is the message.
 */
const LookupMenu = <T extends BaseOption>(
	props: MenuProps<T, boolean, GroupBase<T>>,
) => {
	const { failed, errorMessage, hasOptions } = useContext(LookupMenuContext);
	return (
		<chakraComponents.Menu {...props}>
			{props.children}
			{failed ? (
				<Text
					role="alert"
					srOnly={!hasOptions}
					color="error"
					fontSize="sm"
					px={3}
					py={2}
				>
					{errorMessage}
				</Text>
			) : null}
		</chakraComponents.Menu>
	);
};
LookupMenu.displayName = "LookupMenu";

/** The option list, plus the scroll position that asks for the next page. */
const LookupMenuList = <T extends BaseOption>(
	props: MenuListProps<T, boolean, GroupBase<T>>,
) => {
	const { loadNextPage } = useContext(LookupMenuContext);
	return (
		<chakraComponents.MenuList
			{...props}
			innerProps={{
				...props.innerProps,
				onScroll: (event: React.UIEvent<HTMLDivElement>) => {
					props.innerProps?.onScroll?.(event);
					const list = event.currentTarget;
					const remaining =
						list.scrollHeight - list.scrollTop - list.clientHeight;
					if (remaining > BOTTOM_THRESHOLD_PX) return;
					loadNextPage();
				},
			}}
		/>
	);
};
LookupMenuList.displayName = "LookupMenuList";

/**
 * A searchable select whose options come from somewhere else.
 *
 * It owns the interaction — debounce, menu-open gating, cancellation, stale-
 * answer guarding, paging, loading and failure presentation, and turning a
 * stored id back into a label — and it owns no data. Everything it knows it
 * learned by calling `search` and `resolve`, which the Consumer supplies. It
 * opens no connection of its own and knows nothing about transports,
 * endpoints or auth. See docs/adr/0002-atoms-may-orchestrate-async.md.
 *
 * Options, single values and multi values render through `BaseSelect`, which
 * this composes — the two look alike by construction, not by discipline.
 */
export const LookupSelect = <T extends BaseOption>({
	value,
	onChange,
	search,
	resolve,
	debounceMs = 300,
	emptyMessage = "No matches",
	errorMessage = "Could not load options",
	loadingMessage = "Loading…",
	components,
	isMulti = false,
	...restSelectProps
}: LookupSelectProps<T>) => {
	const [options, setOptions] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);
	/** Labels the resolver supplied, keyed by id. */
	const [resolved, setResolved] = useState<Record<string, T>>({});
	/** Labels that came in with a pick, keyed by id. */
	const [picked, setPicked] = useState<Record<string, T>>({});

	// The Consumer's callbacks are usually inline arrows, so their identity
	// changes every render. Reading them from a ref keeps the debounce and the
	// request runner stable — a debounce rebuilt each render never fires.
	const searchRef = useRef(search);
	const resolveRef = useRef(resolve);
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		searchRef.current = search;
		resolveRef.current = resolve;
		onChangeRef.current = onChange;
	});

	/** What is in the input right now. */
	const queryRef = useRef("");
	/**
	 * The query the options on screen actually answer — set when a request goes
	 * out, not when a key goes down. A cursor belongs to the query that produced
	 * it, so paging asks with this one; between a keystroke and the debounce
	 * firing they differ, and paging with the typed-but-unsent query would ask
	 * for page two of a search nobody has run.
	 */
	const committedQueryRef = useRef("");
	const cursorRef = useRef<string | null>(null);
	const requestIdRef = useRef(0);
	const controllerRef = useRef<AbortController | null>(null);
	const loadingRef = useRef(false);
	const openRef = useRef(false);
	/** Whether a debounced search is already queued for the current input. */
	const pendingRef = useRef(false);

	const runSearch = useCallback(async (query: string, cursor?: string) => {
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;
		// Cancellation is a courtesy the Source may decline; the request id is
		// the guarantee. A late answer whose id has moved on is dropped whether
		// or not anybody honoured the signal.
		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;

		committedQueryRef.current = query;
		loadingRef.current = true;
		setLoading(true);
		setFailed(false);

		try {
			const page = await searchRef.current({
				query,
				cursor,
				signal: controller.signal,
			});
			if (requestId !== requestIdRef.current) return;
			cursorRef.current = page.nextCursor ?? null;
			setOptions((previous) =>
				cursor ? [...previous, ...page.items] : page.items,
			);
		} catch {
			if (requestId !== requestIdRef.current) return;
			if (controller.signal.aborted) return;
			setFailed(true);
		} finally {
			if (requestId === requestIdRef.current) {
				loadingRef.current = false;
				setLoading(false);
			}
		}
	}, []);

	const debouncedSearch = useMemo(
		() =>
			debounce((query: string) => {
				pendingRef.current = false;
				if (!openRef.current) return;
				cursorRef.current = null;
				void runSearch(query);
			}, debounceMs),
		[runSearch, debounceMs],
	);
	useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);
	// Leaving the page is as good a reason to drop a request as any.
	useEffect(
		() => () => {
			controllerRef.current?.abort();
		},
		[],
	);

	const handleMenuOpen = useCallback(() => {
		openRef.current = true;
		cursorRef.current = null;
		// Typing into a closed menu opens it: react-select reports the input
		// change and *then* the open, so a keystroke would otherwise search
		// immediately here and again when the debounce fires. The queued call
		// is the one that should win.
		if (pendingRef.current) return;
		void runSearch(queryRef.current);
	}, [runSearch]);

	const handleMenuClose = useCallback(() => {
		openRef.current = false;
		pendingRef.current = false;
		debouncedSearch.cancel();
		controllerRef.current?.abort();
		controllerRef.current = null;
		// Nothing in flight speaks for the menu any more.
		requestIdRef.current += 1;
		queryRef.current = "";
		committedQueryRef.current = "";
		cursorRef.current = null;
		loadingRef.current = false;
		setOptions([]);
		setLoading(false);
		setFailed(false);
	}, [debouncedSearch]);

	const handleInputChange = useCallback(
		(next: string, meta: InputActionMeta) => {
			// Closing and picking also report an input change; only typing is one.
			if (meta.action !== "input-change") return;
			queryRef.current = next;
			pendingRef.current = true;
			debouncedSearch(next);
		},
		[debouncedSearch],
	);

	const loadNextPage = useCallback(() => {
		if (loadingRef.current) return;
		const cursor = cursorRef.current;
		if (!cursor) return;
		void runSearch(committedQueryRef.current, cursor);
	}, [runSearch]);

	const handleChange = useCallback(
		(next: MultiValue<T> | SingleValue<T>, _actionMeta: ActionMeta<T>) => {
			const items = Array.isArray(next)
				? [...(next as readonly T[])]
				: next
					? [next as T]
					: [];
			if (items.length > 0) {
				setPicked((previous) => {
					const merged = { ...previous };
					for (const item of items) merged[item.id] = item;
					return merged;
				});
			}
			onChangeRef.current?.(isMulti ? items : (items[0] ?? null));
		},
		[isMulti],
	);

	const entries = useMemo<LookupValue<T>[]>(() => {
		if (value == null) return [];
		return Array.isArray(value) ? value : [value];
	}, [value]);

	// A stable key over the ids lacking a label, so the resolver is asked once
	// per set rather than once per render.
	const unresolvedKey = entries
		.filter((entry): entry is string => typeof entry === "string")
		.join(ID_SEPARATOR);
	/** Ids a resolve ran to completion for — asked and answered, never re-asked. */
	const askedRef = useRef<Set<string>>(new Set());
	/** Ids being asked about right now, and by which request. */
	const inFlightRef = useRef<Map<string, AbortController>>(new Map());
	const canResolve = resolve != null;

	useEffect(() => {
		// Read through the ref, not the prop: an inline resolver changes identity
		// every render, and re-running this effect would abort the request it
		// just made. `canResolve` is the one thing about it worth reacting to.
		const resolver = canResolve ? resolveRef.current : undefined;
		if (!resolver) return;

		const missing = unresolvedKey
			.split(ID_SEPARATOR)
			.filter(Boolean)
			.filter(
				(id) => !askedRef.current.has(id) && !inFlightRef.current.has(id),
			);
		if (missing.length === 0) return;

		const controller = new AbortController();
		for (const id of missing) inFlightRef.current.set(id, controller);
		// An attempt that was abandoned must not count as one that happened, or
		// the id is stuck showing itself forever — which is what a StrictMode
		// double-invoke, and any change to the value mid-flight, would cause.
		const release = () => {
			for (const id of missing) {
				if (inFlightRef.current.get(id) === controller) {
					inFlightRef.current.delete(id);
				}
			}
		};

		resolver({ ids: missing, signal: controller.signal })
			.then((items) => {
				release();
				if (controller.signal.aborted) return;
				// Every id in this batch is answered, including ones the resolver
				// had nothing for — asking again would get the same silence.
				for (const id of missing) askedRef.current.add(id);
				setResolved((previous) => {
					const merged = { ...previous };
					for (const item of items) merged[item.id] = item;
					return merged;
				});
			})
			.catch(() => {
				// The raw id keeps showing, and the attempt is forgotten so a
				// later change to the value can try again.
				release();
			});

		return () => {
			controller.abort();
			release();
		};
	}, [unresolvedKey, canResolve]);

	const toOption = useCallback(
		(entry: LookupValue<T>): T => {
			if (typeof entry !== "string") return entry;
			// Resolved label, then the label it was picked with, then the id —
			// visibly degraded rather than blank.
			return (
				resolved[entry] ?? picked[entry] ?? ({ id: entry, label: entry } as T)
			);
		},
		[resolved, picked],
	);

	const selected = useMemo(() => {
		if (isMulti) return entries.map(toOption);
		return entries.length > 0 ? toOption(entries[0]) : null;
	}, [entries, isMulti, toOption]);

	const hasOptions = options.length > 0;
	const menuState = useMemo<LookupMenuState>(
		() => ({ failed, errorMessage, hasOptions, loadNextPage }),
		[failed, errorMessage, hasOptions, loadNextPage],
	);

	return (
		<LookupMenuContext.Provider value={menuState}>
			<BaseSelect<T>
				{...restSelectProps}
				isMulti={isMulti}
				value={selected}
				onChange={handleChange}
				options={options}
				loading={loading}
				// The Source already decided what matches; filtering again here
				// would hide answers whose label does not contain the query.
				filterOption={null}
				onInputChange={handleInputChange}
				onMenuOpen={handleMenuOpen}
				onMenuClose={handleMenuClose}
				loadingMessage={() => loadingMessage}
				// react-select's notice slot: the reason there is nothing to
				// show. On a failure that reason is the failure, not "No
				// matches" — and it must not be null, which collapses the whole
				// menu and takes the alert above with it.
				noOptionsMessage={() => (failed ? errorMessage : emptyMessage)}
				components={{
					...components,
					Menu: LookupMenu,
					MenuList: LookupMenuList,
				}}
			/>
		</LookupMenuContext.Provider>
	);
};
(LookupSelect as { displayName?: string }).displayName = "LookupSelect";
