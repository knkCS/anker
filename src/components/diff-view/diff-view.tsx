// DiffView (#330, Spec #316) — a unified diff rendered per file: a header
// with the path, change type and line counts; old and new line numbers;
// added and removed lines on the `success` and `danger` status palettes;
// collapsible files; long unchanged runs folded behind an expand control.
//
// Text in (`diff`, parsed by `parseUnifiedDiff`) or data in (`files`), so a
// consumer that parses once — to filter files, to count them — hands the
// result straight over. Each file renders the flat row list `buildDiffRows`
// builds, the seam line comments (#331) and virtualisation (#332) plug into.
import { ArrowRight, Ban, ChevronRight, UnfoldVertical } from "lucide-react";
import type React from "react";
import { useCallback, useId, useMemo, useState } from "react";
import { StatusBadge, type StatusBadgeTone } from "../../atoms/status-badge";
import { Box, HStack, Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { buildDiffRows, type DiffRow } from "./diff-rows";
import { parseUnifiedDiff } from "./parse-unified-diff";
import type { DiffChangeType, DiffFile, DiffLine } from "./types";

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
	/** The width of a tab character, in spaces. @default 4 */
	tabSize?: number;
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
	} = props;
	const files = useMemo(
		() => givenFiles ?? parseUnifiedDiff(diff ?? ""),
		[givenFiles, diff],
	);
	const labels = useMemo(
		() => ({ ...DEFAULT_DIFF_VIEW_LABELS, ...labelOverrides }),
		[labelOverrides],
	);

	if (files.length === 0) {
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
		>
			{files.map((file) => (
				<DiffFileSection
					{...props}
					key={file.key}
					file={file}
					labels={labels}
					variant={variant}
				/>
			))}
		</Stack>
	);
}
DiffView.displayName = "DiffView";

interface DiffFileSectionProps extends DiffViewProps {
	file: DiffFile;
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
		headingLevel = 3,
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
	const rows = useMemo(
		() => buildDiffRows(file, { contextLines, expanded }),
		[file, contextLines, expanded],
	);
	const toggle = useCallback(() => {
		const next = !collapsed;
		setCollapsed(next);
		onFileCollapsedChange?.(file, next);
	}, [collapsed, file, onFileCollapsedChange]);
	const expand = useCallback(
		(key: string) => {
			setExpansions((current) => ({
				file,
				keys: new Set(current.file === file ? current.keys : []).add(key),
			}));
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
				>
					{collapsible ? (
						<Box
							as="button"
							{...{ type: "button" }}
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
				{renderFileActions ? (
					<HStack gap="1" flexShrink={0}>
						{renderFileActions(file)}
					</HStack>
				) : null}
			</HStack>
			{collapsed ? null : (
				<Box id={bodyId} data-diff-file-body="" overflowX="auto">
					<FileBody
						file={file}
						rows={rows}
						labels={labels}
						variant={variant}
						tabSize={tabSize}
						onExpand={expand}
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
	onExpand: (key: string) => void;
}

function FileBody({
	file,
	rows,
	labels,
	variant,
	tabSize,
	onExpand,
}: FileBodyProps) {
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

	return (
		<Box
			as="table"
			width="full"
			borderCollapse="collapse"
			fontFamily="mono"
			fontSize={v.fontSize}
			lineHeight="1.5"
			style={{ tabSize }}
		>
			<tbody>
				{rows.map((row) => {
					if (row.type === "hunk") {
						return (
							<Box as="tr" key={row.key} data-diff-row="hunk">
								<Box
									as="td"
									{...{ colSpan: 4 }}
									px={v.cellX}
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
					if (row.type === "fold") {
						return (
							<Box as="tr" key={row.key} data-diff-row="fold">
								<Box as="td" {...{ colSpan: 4 }} p="0" bg="bg-subtle">
									<Box
										as="button"
										{...{ type: "button" }}
										onClick={() => onExpand(row.key)}
										display="flex"
										alignItems="center"
										gap="1.5"
										width="full"
										minH="44px"
										px={v.cellX}
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
						<LineRow
							key={row.key}
							line={row.line}
							labels={labels}
							cellX={v.cellX}
						/>
					);
				})}
			</tbody>
		</Box>
	);
}

function LineRow({
	line,
	labels,
	cellX,
}: {
	line: DiffLine;
	labels: DiffViewLabels;
	cellX: string;
}) {
	const paint = KIND_STYLES[line.kind];
	const gutter = {
		px: cellX,
		width: "1%",
		minW: "3ch",
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
