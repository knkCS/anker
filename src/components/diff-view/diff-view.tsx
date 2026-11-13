// DiffView (#330, Spec #316) — a unified diff rendered per file: a header
// with the path, change type and line counts; old and new line numbers;
// added and removed lines on the `success` and `danger` status palettes;
// collapsible files; long unchanged runs folded behind an expand control;
// comments (#331) anchored to a line, under that line, or at the file level
// when the line is not in the hunks — none dropped; `j`/`k` and `n`/`p` jump
// between files and comments. A file longer than `virtualizeAbove` rows
// (#332) renders in a scrolling pane of its own that draws only the rows in
// view.
//
// Text in (`diff`, parsed by `parseUnifiedDiff`) or data in (`files`), so a
// consumer that parses once — to filter files, to count them — hands the
// result straight over. Each file renders the flat row list `buildDiffRows`
// builds, the seam line comments (#331) and virtualisation (#332) plug into.

import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import {
	ArrowRight,
	Ban,
	ChevronRight,
	MessageSquare,
	UnfoldVertical,
} from "lucide-react";
import type React from "react";
import {
	useCallback,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { StatusBadge, type StatusBadgeTone } from "../../atoms/status-badge";
import { Box, HStack, Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { MessageBubble, MessageGroup } from "../message";
import { anchorComments, groupCommentsByFile } from "./diff-comments";
import {
	findCommentJump,
	findFileTarget,
	type PaneComment,
	ROW_INDEX_ATTR,
	registerVirtualPane,
} from "./diff-jumps";
import { buildDiffRows, type DiffRow } from "./diff-rows";
import { parseUnifiedDiff } from "./parse-unified-diff";
import type {
	DiffChangeType,
	DiffComment,
	DiffCommentTone,
	DiffFile,
	DiffLine,
	DiffSide,
} from "./types";
import {
	estimateRowSize,
	lineNumberDigits,
	shouldVirtualize,
	widestLine,
	windowWithGaps,
	withKeptRows,
} from "./virtual-rows";

export type DiffViewVariant = "default" | "compact";

/** Every user-facing string of a `DiffView`, with English defaults. */
export interface DiffViewLabels {
	added: string;
	modified: string;
	deleted: string;
	renamed: string;
	binary: string;
	/** Announced before an added line's content. */
	addedLine: string;
	/** Announced before a removed line's content. */
	removedLine: string;
	noNewlineAtEnd: string;
	/** The body of a binary file. */
	binaryFile: string;
	/** The body of a renamed file whose content did not change. */
	renamedWithoutChanges: string;
	/** The body of a file with no hunks (a mode change). */
	noContentChanges: string;
	/** Shown when the diff has no file. */
	empty: string;
	/** The title of a file the diff names no path for (bare hunks). */
	untitledFile: string;
	/** The fold's button. */
	formatExpand: (count: number) => string;
	/** The line counts as read by assistive tech. */
	formatLineCounts: (additions: number, deletions: number) => string;
	/** The comment count in a file's header. */
	formatCommentCount: (count: number) => string;
	/** Where a file-level comment points: a line outside the hunks. */
	formatLine: (line: number, side: DiffSide) => string;
	/** Names a comment for assistive tech. */
	formatCommentLabel: (comment: DiffComment) => string;
	/** The heading over comments on files the diff does not contain. */
	otherFilesComments: string;
}

const plural = (count: number, one: string, many: string) =>
	`${count} ${count === 1 ? one : many}`;

export const DEFAULT_DIFF_VIEW_LABELS: DiffViewLabels = {
	added: "Added",
	modified: "Modified",
	deleted: "Deleted",
	renamed: "Renamed",
	binary: "Binary",
	addedLine: "Added",
	removedLine: "Removed",
	noNewlineAtEnd: "No newline at end of file",
	binaryFile: "Binary file not shown",
	renamedWithoutChanges: "File renamed without changes",
	noContentChanges: "No content changes",
	empty: "No changes",
	untitledFile: "Diff",
	formatExpand: (count) =>
		`Expand ${plural(count, "unchanged line", "unchanged lines")}`,
	formatLineCounts: (additions, deletions) =>
		`${plural(additions, "addition", "additions")}, ${plural(deletions, "deletion", "deletions")}`,
	formatCommentCount: (count) => plural(count, "comment", "comments"),
	formatLine: (line, side) => `${side === "old" ? "Old line" : "Line"} ${line}`,
	formatCommentLabel: (comment) => {
		const by = comment.author ? ` by ${comment.author}` : "";
		const line =
			comment.line == null
				? ""
				: `, ${comment.side === "old" ? "old line" : "line"} ${comment.line}`;
		return `Comment${by} on ${comment.path}${line}`;
	},
	otherFilesComments: "Comments on files not in this diff",
};

export interface DiffViewProps {
	/** Unified diff text, as `git diff` prints it. Ignored when `files` is given. */
	diff?: string;
	/** Already parsed files (from `parseUnifiedDiff`); wins over `diff`. */
	files?: readonly DiffFile[];
	/**
	 * `default` — a card per file, collapsible from its header.
	 * `compact` — smaller type, a slim header that does not collapse: one
	 * file in a detail pane or an inspector.
	 * @default "default"
	 */
	variant?: DiffViewVariant;
	/**
	 * Unchanged lines kept next to each change; a longer unchanged run folds
	 * behind an expand control. `Infinity` folds nothing. @default 3
	 */
	contextLines?: number;
	/**
	 * Files that start collapsed: `true` for all, or a predicate (collapse
	 * lockfiles, generated code). `default` variant only. @default false
	 */
	defaultCollapsed?: boolean | ((file: DiffFile) => boolean);
	/** Called when the reader collapses or expands a file. */
	onFileCollapsedChange?: (file: DiffFile, collapsed: boolean) => void;
	/** Extra content at the end of a file's header (a link, a menu). */
	renderFileActions?: (file: DiffFile) => React.ReactNode;
	/**
	 * Comments anchored to a file and, optionally, a line (new or old side).
	 * Each renders under its line; one without a line, or on a line outside
	 * the hunks, at the top of its file; one on a file the diff does not
	 * contain, after the files. A commented line is never folded. Pass a
	 * memoised array: a new one re-places every comment.
	 */
	comments?: readonly DiffComment[];
	/**
	 * Renders a comment's content in place of anker's default (a
	 * `MessageGroup` with the author and avatar, a `MessageBubble` with the
	 * timestamp, the `label` badge and the `body`). anker keeps the frame:
	 * the tone edge, focus and the keyboard jumps. `file` is `null` for a
	 * comment on a file the diff does not contain.
	 */
	renderComment?: (
		comment: DiffComment,
		file: DiffFile | null,
	) => React.ReactNode;
	/**
	 * Keyboard jumps while focus is inside the diff: `j` / `k` to the next /
	 * previous file, `n` / `p` to the next / previous comment. Ignored in
	 * text fields and with a modifier key. @default true
	 */
	keyboardNavigation?: boolean;
	/** The width of a tab character, in spaces. @default 4 */
	tabSize?: number;
	/**
	 * A file with more rows than this (hunk headers and lines, folds aside)
	 * renders in a scrolling pane of its own, at most 70% of the viewport
	 * tall, that draws only the rows in view — line numbers, folds, comments
	 * and the keyboard jumps work as in any file. `Infinity` renders every
	 * file whole. @default 500
	 */
	virtualizeAbove?: number;
	/** The heading level of the file paths. @default 3 */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
	/** Names the whole diff for assistive tech. */
	"aria-label"?: string;
	/** Overrides for the English strings. */
	labels?: Partial<DiffViewLabels>;
}

const CHANGE_TONE: Record<DiffChangeType, StatusBadgeTone> = {
	added: "success",
	modified: "neutral",
	deleted: "danger",
	renamed: "info",
};

/** Row paint per line kind: the line's surface, its gutter text, its sign. */
const KIND_STYLES: Record<
	DiffLine["kind"],
	{ bg: string; gutter: string; sign: string; glyph: string }
> = {
	context: { bg: "bg-surface", gutter: "muted", sign: "muted", glyph: " " },
	added: {
		bg: "success.subtle",
		gutter: "success.fg",
		sign: "success.fg",
		glyph: "+",
	},
	removed: {
		bg: "danger.subtle",
		gutter: "danger.fg",
		sign: "danger.fg",
		glyph: "-",
	},
};

/** The inline-start edge of a comment, per tone. */
const TONE_EDGE: Record<DiffCommentTone, string> = {
	success: "success.border",
	warning: "warning.border",
	danger: "danger.border",
	info: "info.border",
	neutral: "border-emphasized",
	accent: "primary.border",
};

/**
 * Keys typed here belong to the element: text entry, and widgets with their
 * own typeahead (a menu or listbox from `renderFileActions`).
 */
const OWNS_KEYS =
	"input, textarea, select, [contenteditable='true'], [role='menu'], [role='menubar'], [role='menuitem'], [role='listbox'], [role='option'], [role='combobox'], [role='tree'], [role='grid']";

const ownsKeys = (element: HTMLElement) =>
	element.isContentEditable || element.closest(OWNS_KEYS) !== null;

const JUMPS: Record<string, { to: "file" | "comment"; direction: 1 | -1 }> = {
	j: { to: "file", direction: 1 },
	k: { to: "file", direction: -1 },
	n: { to: "comment", direction: 1 },
	p: { to: "comment", direction: -1 },
};

const VARIANT_STYLES: Record<
	DiffViewVariant,
	{ fontSize: string; cellX: string; headerY: string; headerX: string }
> = {
	default: { fontSize: "sm", cellX: "2", headerY: "2", headerX: "3" },
	compact: { fontSize: "xs", cellX: "1.5", headerY: "1", headerX: "2" },
};

export function DiffView(props: DiffViewProps) {
	const {
		diff,
		files: givenFiles,
		variant = "default",
		labels: labelOverrides,
		"aria-label": ariaLabel,
		comments,
		keyboardNavigation = true,
		headingLevel = 3,
	} = props;
	const files = useMemo(
		() => givenFiles ?? parseUnifiedDiff(diff ?? ""),
		[givenFiles, diff],
	);
	const labels = useMemo(
		() => ({ ...DEFAULT_DIFF_VIEW_LABELS, ...labelOverrides }),
		[labelOverrides],
	);
	const grouped = useMemo(
		() => groupCommentsByFile(files, comments ?? []),
		[files, comments],
	);
	const onKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLElement>) => {
			if (!keyboardNavigation || event.defaultPrevented) return;
			if (event.altKey || event.ctrlKey || event.metaKey) return;
			const jump = JUMPS[event.key];
			const from = event.target as HTMLElement;
			// A portal (a menu opened from a comment) bubbles through React
			// but is not in the diff's DOM: not ours.
			if (!jump || !event.currentTarget.contains(from) || ownsKeys(from)) {
				return;
			}
			const root = event.currentTarget;
			const go =
				jump.to === "file"
					? findFileTarget(root, from, jump.direction)
					: findCommentJump(root, from, jump.direction);
			if (!go) return;
			event.preventDefault();
			if (typeof go === "function") go();
			else go.focus();
		},
		[keyboardNavigation],
	);

	if (files.length === 0 && grouped.orphans.length === 0) {
		return (
			<Box
				data-diff-view=""
				data-variant={variant}
				aria-label={ariaLabel}
				role={ariaLabel ? "region" : undefined}
				px="3"
				py="4"
				borderWidth="1px"
				borderColor="border"
				borderRadius="md"
				bg="bg-surface"
			>
				<Text fontSize="sm" color="muted">
					{labels.empty}
				</Text>
			</Box>
		);
	}

	return (
		<Stack
			data-diff-view=""
			data-variant={variant}
			aria-label={ariaLabel}
			role={ariaLabel ? "region" : undefined}
			gap={variant === "compact" ? "2" : "4"}
			onKeyDown={onKeyDown}
		>
			{files.length === 0 ? (
				<Text fontSize="sm" color="muted" px="3" py="4">
					{labels.empty}
				</Text>
			) : null}
			{files.map((file) => (
				<DiffFileSection
					{...props}
					headingLevel={headingLevel}
					key={file.key}
					file={file}
					fileComments={grouped.byFile.get(file)}
					labels={labels}
					variant={variant}
				/>
			))}
			{grouped.orphans.length > 0 ? (
				<Box
					as="section"
					data-diff-other-comments=""
					aria-label={labels.otherFilesComments}
					borderWidth="1px"
					borderColor="border"
					borderRadius="md"
					bg="bg-subtle"
					overflow="hidden"
				>
					<Box
						as={`h${headingLevel}`}
						m="0"
						px={VARIANT_STYLES[variant].headerX}
						py={VARIANT_STYLES[variant].headerY}
						fontSize={VARIANT_STYLES[variant].fontSize}
						fontWeight="medium"
						color="default"
						borderBottomWidth="1px"
						borderColor="border"
					>
						{labels.otherFilesComments}
					</Box>
					<CommentList
						comments={grouped.orphans}
						file={null}
						labels={labels}
						renderComment={props.renderComment}
						caption={(comment) =>
							comment.line == null
								? comment.path
								: `${comment.path} · ${labels.formatLine(comment.line, comment.side ?? "new")}`
						}
						px={VARIANT_STYLES[variant].headerX}
					/>
				</Box>
			) : null}
		</Stack>
	);
}
DiffView.displayName = "DiffView";

interface DiffFileSectionProps extends Omit<DiffViewProps, "headingLevel"> {
	headingLevel: NonNullable<DiffViewProps["headingLevel"]>;
	file: DiffFile;
	fileComments: readonly DiffComment[] | undefined;
	labels: DiffViewLabels;
	variant: DiffViewVariant;
}

function DiffFileSection(props: DiffFileSectionProps) {
	const {
		file,
		labels,
		variant,
		contextLines = 3,
		defaultCollapsed = false,
		onFileCollapsedChange,
		renderFileActions,
		tabSize = 4,
		virtualizeAbove = 500,
		headingLevel,
		fileComments,
		renderComment,
	} = props;
	const id = useId();
	const titleId = `${id}-title`;
	const bodyId = `${id}-body`;
	const collapsible = variant === "default";
	const [collapsed, setCollapsed] = useState(
		() =>
			collapsible &&
			(typeof defaultCollapsed === "function"
				? defaultCollapsed(file)
				: defaultCollapsed),
	);
	// Fold keys are positions in this file's hunks, so the reader's
	// expansions belong to this `file` object: a new revision of the same
	// path starts folded again. (Collapse persists by path.)
	const [expansions, setExpansions] = useState<{
		file: DiffFile;
		keys: ReadonlySet<string>;
	}>(() => ({ file, keys: new Set() }));
	const expanded = useMemo(
		() => (expansions.file === file ? expansions.keys : new Set<string>()),
		[expansions, file],
	);
	const anchored = useMemo(
		() => anchorComments(file, fileComments ?? []),
		[file, fileComments],
	);
	const rows = useMemo(
		() =>
			buildDiffRows(file, {
				contextLines,
				expanded,
				comments: anchored.byLine,
			}),
		[file, contextLines, expanded, anchored],
	);
	const commentCount = fileComments?.length ?? 0;
	const toggle = useCallback(() => {
		const next = !collapsed;
		setCollapsed(next);
		onFileCollapsedChange?.(file, next);
	}, [collapsed, file, onFileCollapsedChange]);
	const expand = useCallback(
		(lineKeys: readonly string[]) => {
			setExpansions((current) => {
				const keys = new Set(current.file === file ? current.keys : []);
				for (const key of lineKeys) keys.add(key);
				return { file, keys };
			});
		},
		[file],
	);

	const v = VARIANT_STYLES[variant];
	const title = file.path || labels.untitledFile;
	const pathText =
		file.changeType === "renamed" && file.oldPath && file.newPath ? (
			<>
				<Box as="span" color="muted">
					{file.oldPath}
				</Box>
				<Box
					as="span"
					display="inline-flex"
					color="muted"
					aria-label={`, ${labels.renamed.toLowerCase()} to `}
					role="img"
				>
					<ArrowRight size={12} aria-hidden />
				</Box>
				<Box as="span">{file.newPath}</Box>
			</>
		) : (
			title
		);

	return (
		<Box
			as="section"
			aria-labelledby={titleId}
			data-diff-file={file.key}
			data-change-type={file.changeType}
			data-binary={file.binary ? "" : undefined}
			data-collapsed={collapsed ? "" : undefined}
			borderWidth="1px"
			borderColor="border"
			borderRadius="md"
			bg="bg-surface"
			overflow="hidden"
		>
			<HStack
				data-diff-file-header=""
				gap="2"
				px={v.headerX}
				py={v.headerY}
				bg="bg-subtle"
				borderBottomWidth={collapsed ? "0" : "1px"}
				borderColor="border"
				flexWrap="wrap"
			>
				<Box
					as={`h${headingLevel}`}
					id={titleId}
					flex="1"
					minW="0"
					m="0"
					fontSize={v.fontSize}
					fontWeight="medium"
					fontFamily="mono"
					color="default"
					{...(collapsible
						? {}
						: {
								"data-diff-file-focus": "",
								tabIndex: -1,
								_focusVisible: { outline: "none", boxShadow: "focus-ring" },
								borderRadius: "sm",
							})}
				>
					{collapsible ? (
						<Box
							as="button"
							{...{ type: "button" }}
							data-diff-file-focus=""
							aria-expanded={!collapsed}
							aria-controls={collapsed ? undefined : bodyId}
							onClick={toggle}
							display="inline-flex"
							alignItems="center"
							gap="1.5"
							maxW="full"
							minH="44px"
							my="-2"
							textAlign="start"
							color="inherit"
							cursor="pointer"
							borderRadius="sm"
							_focusVisible={{ outline: "none", boxShadow: "focus-ring" }}
						>
							<Box
								as="span"
								display="inline-flex"
								flexShrink={0}
								transition="transform 150ms"
								transform={collapsed ? undefined : "rotate(90deg)"}
							>
								<ChevronRight size={14} aria-hidden />
							</Box>
							<Box
								as="span"
								display="inline-flex"
								gap="1"
								flexWrap="wrap"
								wordBreak="break-all"
							>
								{pathText}
							</Box>
						</Box>
					) : (
						<Box
							as="span"
							display="inline-flex"
							gap="1"
							flexWrap="wrap"
							wordBreak="break-all"
						>
							{pathText}
						</Box>
					)}
				</Box>
				<HStack gap="1" flexShrink={0}>
					{variant === "default" || file.changeType !== "modified" ? (
						<StatusBadge
							tone={CHANGE_TONE[file.changeType]}
							label={labels[file.changeType]}
						/>
					) : null}
					{file.binary ? (
						<StatusBadge tone="neutral" label={labels.binary} />
					) : null}
				</HStack>
				{file.binary || file.hunks.length === 0 ? null : (
					<Text
						as="span"
						data-diff-counts=""
						fontSize="xs"
						fontFamily="mono"
						flexShrink={0}
					>
						<Box as="span" aria-hidden color="success.fg">
							+{file.additions}
						</Box>{" "}
						<Box as="span" aria-hidden color="danger.fg">
							-{file.deletions}
						</Box>
						<Box as="span" srOnly>
							{labels.formatLineCounts(file.additions, file.deletions)}
						</Box>
					</Text>
				)}
				{commentCount > 0 ? (
					<HStack
						as="span"
						data-diff-comment-count=""
						gap="1"
						flexShrink={0}
						fontSize="xs"
						color="muted"
					>
						<MessageSquare size={12} aria-hidden />
						{labels.formatCommentCount(commentCount)}
					</HStack>
				) : null}
				{renderFileActions ? (
					<HStack gap="1" flexShrink={0}>
						{renderFileActions(file)}
					</HStack>
				) : null}
			</HStack>
			{collapsed ? null : (
				<Box id={bodyId} data-diff-file-body="">
					{anchored.fileLevel.length > 0 ? (
						<Box
							data-diff-file-comments=""
							bg="bg-subtle"
							borderBottomWidth="1px"
							borderColor="border"
						>
							<CommentList
								comments={anchored.fileLevel}
								file={file}
								labels={labels}
								renderComment={renderComment}
								caption={(comment) =>
									comment.line == null
										? undefined
										: labels.formatLine(comment.line, comment.side ?? "new")
								}
								px={v.headerX}
							/>
						</Box>
					) : null}
					<FileBody
						file={file}
						rows={rows}
						labels={labels}
						variant={variant}
						tabSize={tabSize}
						virtualize={shouldVirtualize(file, virtualizeAbove)}
						onExpand={expand}
						renderComment={renderComment}
					/>
				</Box>
			)}
		</Box>
	);
}

interface FileBodyProps {
	file: DiffFile;
	rows: DiffRow[];
	labels: DiffViewLabels;
	variant: DiffViewVariant;
	tabSize: number;
	/** Render in a virtualised pane (#332) instead of a whole table. */
	virtualize: boolean;
	onExpand: (lineKeys: readonly string[]) => void;
	renderComment: DiffViewProps["renderComment"];
}

/** What every row needs to render, whichever body draws it. */
interface RowContext {
	file: DiffFile;
	labels: DiffViewLabels;
	cellX: string;
	/** Comment rows' inline padding, as in the file header. */
	headerX: string;
	/** The line-number columns' minimum width, sized to the file's numbers. */
	gutterW: string;
	/** The code column's minimum width, in a pane; unset in a whole table. */
	contentW?: string;
	onExpand: (lineKeys: readonly string[]) => void;
	renderComment: DiffViewProps["renderComment"];
}

/** Extra attributes a virtualised pane puts on each drawn row. */
interface RowProps {
	ref?: React.Ref<HTMLTableRowElement>;
	[ROW_INDEX_ATTR]?: number;
}

function FileBody(props: FileBodyProps) {
	const { file, labels, variant, virtualize } = props;
	const v = VARIANT_STYLES[variant];
	if (file.binary || file.hunks.length === 0) {
		const message = file.binary
			? labels.binaryFile
			: file.changeType === "renamed"
				? labels.renamedWithoutChanges
				: labels.noContentChanges;
		return (
			<Text
				data-diff-message=""
				px={v.headerX}
				py={v.headerY}
				fontSize={v.fontSize}
				color="muted"
			>
				{message}
			</Text>
		);
	}
	return virtualize ? <VirtualBody {...props} /> : <WholeBody {...props} />;
}

function useRowContext({
	file,
	labels,
	variant,
	tabSize,
	virtualize,
	onExpand,
	renderComment,
}: FileBodyProps): RowContext {
	const digits = useMemo(() => lineNumberDigits(file), [file]);
	const widest = useMemo(
		() => (virtualize ? widestLine(file, tabSize) : 0),
		[virtualize, file, tabSize],
	);
	return {
		file,
		labels,
		cellX: VARIANT_STYLES[variant].cellX,
		headerX: VARIANT_STYLES[variant].headerX,
		gutterW: `${Math.max(3, digits)}ch`,
		// A pane draws a few rows at a time: sized to the widest line, the
		// code column does not jump as rows come and go.
		contentW: virtualize ? `${widest}ch` : undefined,
		onExpand,
		renderComment,
	};
}

function RowsTable({
	variant,
	tabSize,
	children,
}: {
	variant: DiffViewVariant;
	tabSize: number;
	children: React.ReactNode;
}) {
	return (
		<Box
			as="table"
			width="full"
			borderCollapse="collapse"
			fontFamily="mono"
			fontSize={VARIANT_STYLES[variant].fontSize}
			lineHeight="1.5"
			style={{ tabSize }}
		>
			<tbody>{children}</tbody>
		</Box>
	);
}

function WholeBody(props: FileBodyProps) {
	const ctx = useRowContext(props);
	return (
		<Box overflowX="auto">
			<RowsTable variant={props.variant} tabSize={props.tabSize}>
				{props.rows.map((row) => renderRow(row, ctx))}
			</RowsTable>
		</Box>
	);
}

/**
 * A large file's rows in a scrolling pane that draws only the rows in view
 * (`@tanstack/react-virtual`), with spacer rows standing in for the rest.
 * The row holding focus stays drawn when it scrolls out of view, and the
 * pane registers its comments so `n` / `p` reach the ones not drawn.
 */
function VirtualBody(props: FileBodyProps) {
	const { rows, variant } = props;
	const ctx = useRowContext(props);
	const paneRef = useRef<HTMLDivElement>(null);
	// Rows kept drawn outside the window, by key: rows shift as folds open.
	const [focusedKey, setFocusedKey] = useState<string>();
	const [pending, setPending] = useState<{ key: string; nth: number }>();
	const indexOf = useCallback(
		(key: string | undefined) =>
			key == null ? undefined : rows.findIndex((row) => row.key === key),
		[rows],
	);
	const focusedIndex = indexOf(focusedKey);
	const pendingIndex = indexOf(pending?.key);
	const rangeExtractor = useCallback(
		(range: Parameters<typeof defaultRangeExtractor>[0]) =>
			withKeptRows(
				defaultRangeExtractor(range),
				[focusedIndex, pendingIndex],
				rows,
			),
		[focusedIndex, pendingIndex, rows],
	);
	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => paneRef.current,
		estimateSize: (index) => estimateRowSize(rows[index], variant),
		getItemKey: (index) => rows[index]?.key ?? index,
		indexAttribute: ROW_INDEX_ATTR,
		overscan: 10,
		rangeExtractor,
	});

	// The comment to focus once its row is drawn.
	const focusComment = useCallback((index: number, nth: number) => {
		const row = paneRef.current?.querySelector(
			`[${ROW_INDEX_ATTR}="${index}"]`,
		);
		const target = row?.querySelectorAll<HTMLElement>("[data-diff-comment]")[
			nth
		];
		target?.focus();
		return target != null;
	}, []);
	useLayoutEffect(() => {
		if (!pending || pendingIndex == null) return;
		if (pendingIndex < 0 || focusComment(pendingIndex, pending.nth)) {
			setPending(undefined);
		}
	});

	// What `n` / `p` need of the pane, read fresh at each keypress.
	const rowsRef = useRef(rows);
	rowsRef.current = rows;
	useLayoutEffect(() => {
		const pane = paneRef.current;
		if (!pane) return;
		return registerVirtualPane(pane, {
			comments: () => {
				const list: PaneComment[] = [];
				rowsRef.current.forEach((row, index) => {
					if (row.type !== "comments") return;
					for (let nth = 0; nth < row.comments.length; nth++) {
						list.push({ row: index, nth });
					}
				});
				return list;
			},
			reveal: ({ row, nth }) => {
				if (focusComment(row, nth)) return;
				const key = rowsRef.current[row]?.key;
				if (key != null) setPending({ key, nth });
			},
		});
	}, [focusComment]);

	const onFocus = useCallback((event: React.FocusEvent<HTMLElement>) => {
		const row = (event.target as HTMLElement).closest(`[${ROW_INDEX_ATTR}]`);
		const index = Number(row?.getAttribute(ROW_INDEX_ATTR));
		setFocusedKey(row ? rowsRef.current[index]?.key : undefined);
	}, []);
	const onBlur = useCallback((event: React.FocusEvent<HTMLElement>) => {
		const next = event.relatedTarget as Node | null;
		if (!next || !event.currentTarget.contains(next)) setFocusedKey(undefined);
	}, []);

	const items = virtualizer.getVirtualItems();
	const entries = windowWithGaps(items, virtualizer.getTotalSize());
	return (
		<Box
			ref={paneRef}
			data-diff-virtual=""
			overflow="auto"
			maxH="70vh"
			onFocus={onFocus}
			onBlur={onBlur}
		>
			<RowsTable variant={variant} tabSize={props.tabSize}>
				{entries.map((entry) => {
					if (entry.type === "gap") {
						return (
							<tr key={entry.key} aria-hidden data-diff-row="spacer">
								{/* Inline: a style prop would mint a class per height. */}
								<td colSpan={4} style={{ padding: 0, height: entry.size }} />
							</tr>
						);
					}
					const row = rows[entry.index];
					return renderRow(row, ctx, {
						ref: virtualizer.measureElement,
						[ROW_INDEX_ATTR]: entry.index,
					});
				})}
			</RowsTable>
		</Box>
	);
}

function renderRow(row: DiffRow, ctx: RowContext, rowProps: RowProps = {}) {
	const { file, labels, cellX, headerX, onExpand, renderComment } = ctx;
	if (row.type === "hunk") {
		return (
			<Box as="tr" key={row.key} data-diff-row="hunk" {...rowProps}>
				<Box
					as="td"
					{...{ colSpan: 4 }}
					px={cellX}
					py="0.5"
					bg="info.subtle"
					color="info.fg"
					whiteSpace="pre"
				>
					{row.hunk.header}
				</Box>
			</Box>
		);
	}
	if (row.type === "comments") {
		return (
			<Box
				as="tr"
				key={row.key}
				data-diff-row="comments"
				data-old-line={row.line.oldNumber ?? undefined}
				data-new-line={row.line.newNumber ?? undefined}
				{...rowProps}
			>
				<Box
					as="td"
					{...{ colSpan: 4 }}
					p="0"
					bg="bg-subtle"
					borderYWidth="1px"
					borderColor="border"
					fontFamily="body"
					whiteSpace="normal"
				>
					<CommentList
						comments={row.comments}
						file={file}
						labels={labels}
						renderComment={renderComment}
						px={headerX}
					/>
				</Box>
			</Box>
		);
	}
	if (row.type === "fold") {
		return (
			<Box as="tr" key={row.key} data-diff-row="fold" {...rowProps}>
				<Box as="td" {...{ colSpan: 4 }} p="0" bg="bg-subtle">
					<Box
						as="button"
						{...{ type: "button" }}
						onClick={() => onExpand(row.lineKeys)}
						display="flex"
						alignItems="center"
						gap="1.5"
						width="full"
						minH="44px"
						px={cellX}
						fontFamily="body"
						fontSize="xs"
						color="accent"
						cursor="pointer"
						textAlign="start"
						_hover={{ bg: "bg-muted" }}
						_focusVisible={{ outline: "none", boxShadow: "focus-ring" }}
					>
						<UnfoldVertical size={14} aria-hidden />
						{labels.formatExpand(row.lines.length)}
					</Box>
				</Box>
			</Box>
		);
	}
	return (
		<LineRow key={row.key} line={row.line} ctx={ctx} rowProps={rowProps} />
	);
}

function LineRow({
	line,
	ctx,
	rowProps,
}: {
	line: DiffLine;
	ctx: RowContext;
	rowProps: RowProps;
}) {
	const { labels, cellX, gutterW, contentW } = ctx;
	const paint = KIND_STYLES[line.kind];
	const gutter = {
		px: cellX,
		width: "1%",
		minW: gutterW,
		textAlign: "end" as const,
		color: paint.gutter,
		whiteSpace: "nowrap" as const,
		userSelect: "none" as const,
		verticalAlign: "top" as const,
	};
	return (
		<Box
			as="tr"
			data-diff-row="line"
			data-kind={line.kind}
			data-old-line={line.oldNumber ?? undefined}
			data-new-line={line.newNumber ?? undefined}
			bg={paint.bg}
			{...rowProps}
		>
			<Box as="td" data-diff-gutter="old" {...gutter}>
				{line.oldNumber}
			</Box>
			<Box as="td" data-diff-gutter="new" {...gutter}>
				{line.newNumber}
			</Box>
			<Box
				as="td"
				data-diff-sign=""
				aria-hidden
				width="1%"
				ps="1"
				color={paint.sign}
				userSelect="none"
				verticalAlign="top"
				whiteSpace="pre"
			>
				{paint.glyph}
			</Box>
			<Box
				as="td"
				data-diff-content=""
				pe={cellX}
				minW={contentW}
				color="default"
				whiteSpace="pre"
			>
				{line.kind === "context" ? null : (
					<Box as="span" srOnly>
						{line.kind === "added" ? labels.addedLine : labels.removedLine}:{" "}
					</Box>
				)}
				{line.content}
				{line.noNewlineAtEnd ? (
					<Box
						as="span"
						data-diff-no-newline=""
						display="inline-flex"
						verticalAlign="middle"
						ms="2"
						color="muted"
						title={labels.noNewlineAtEnd}
					>
						<Ban size={12} aria-hidden />
						<Box as="span" srOnly>
							{labels.noNewlineAtEnd}
						</Box>
					</Box>
				) : null}
			</Box>
		</Box>
	);
}

interface CommentListProps {
	comments: readonly DiffComment[];
	file: DiffFile | null;
	labels: DiffViewLabels;
	renderComment: DiffViewProps["renderComment"];
	/** A line above a comment saying where it points, when its place does not. */
	caption?: (comment: DiffComment) => string | undefined;
	px: string;
}

function CommentList({
	comments,
	file,
	labels,
	renderComment,
	caption,
	px,
}: CommentListProps) {
	// A repeated id must not merge two comments: the second gets `id#2`.
	const seen = new Map<string, number>();
	return (
		<Stack gap="2" px={px} py="2">
			{comments.map((comment) => {
				const nth = (seen.get(comment.id) ?? 0) + 1;
				seen.set(comment.id, nth);
				const tone = comment.tone ?? "neutral";
				const where = caption?.(comment);
				return (
					<Box
						key={nth === 1 ? comment.id : `${comment.id}#${nth}`}
						role="article"
						tabIndex={0}
						aria-label={labels.formatCommentLabel(comment)}
						data-diff-comment={comment.id}
						data-tone={tone}
						data-side={
							comment.line == null ? undefined : (comment.side ?? "new")
						}
						ps="3"
						py="1"
						borderStartWidth="3px"
						borderColor={TONE_EDGE[tone]}
						fontFamily="body"
						fontSize="sm"
						color="default"
						whiteSpace="normal"
						_focusVisible={{ outline: "none", boxShadow: "focus-ring" }}
					>
						{where ? (
							<Text
								data-diff-comment-anchor=""
								fontSize="xs"
								color="muted"
								fontFamily="mono"
								mb="1"
							>
								{where}
							</Text>
						) : null}
						{renderComment ? (
							renderComment(comment, file)
						) : (
							<MessageGroup author={comment.author} avatar={comment.avatar}>
								<MessageBubble timestamp={comment.timestamp}>
									<Stack gap="1" align="flex-start">
										{comment.label ? (
											<StatusBadge tone={tone} label={comment.label} />
										) : null}
										{comment.body}
									</Stack>
								</MessageBubble>
							</MessageGroup>
						)}
					</Box>
				);
			})}
		</Stack>
	);
}
