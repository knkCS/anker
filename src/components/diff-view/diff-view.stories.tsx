import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ExternalLink } from "lucide-react";
import { Button, IconButton } from "../../atoms/button";
import { Avatar } from "../../primitives/avatar";
import { DarkMode, LightMode } from "../../primitives/color-mode";
import { Box, Grid, HStack, Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { DiffView } from "./diff-view";
import type { DiffComment } from "./types";

/**
 * A unified diff (as `git diff` prints it) rendered per file: path, change
 * type and line counts in the header, old and new line numbers, added and
 * removed lines on the `success` and `danger` palettes, long unchanged runs
 * folded behind an expand control. Click a file's path to collapse it.
 * Comments anchor to a file and line; with focus inside the diff, `j` / `k`
 * jump between files and `n` / `p` between comments. A file of more than
 * `virtualizeAbove` rows scrolls in a pane that draws only the rows in view
 * ("Large diff").
 * Toggle the toolbar theme, or open "Light and dark", for both modes.
 */
const meta = {
	title: "Components/DiffView",
	component: DiffView,
	parameters: { layout: "padded" },
} satisfies Meta<typeof DiffView>;

export default meta;
type Story = StoryObj<typeof meta>;

const unchanged = (from: number, count: number) =>
	Array.from({ length: count }, (_, i) => ` \tstep(${from + i});`);

const MULTI_FILE = [
	"diff --git a/internal/runner/runner.go b/internal/runner/runner.go",
	"index 3b18e51..a3c5d2f 100644",
	"--- a/internal/runner/runner.go",
	"+++ b/internal/runner/runner.go",
	"@@ -12,22 +12,24 @@ func (r *Runner) Run(ctx context.Context) error {",
	" \tif err := r.prepare(ctx); err != nil {",
	"-\t\treturn err",
	'+\t\treturn fmt.Errorf("prepare: %w", err)',
	" \t}",
	...unchanged(1, 14),
	'-\tr.log.Info("done")',
	'+\tr.log.Info("done", "attempts", r.attempts)',
	"+\tr.metrics.Observe(r.attempts)",
	" \treturn nil",
	" }",
	"diff --git a/docs/runner.md b/docs/runner.md",
	"new file mode 100644",
	"index 0000000..e69de29",
	"--- /dev/null",
	"+++ b/docs/runner.md",
	"@@ -0,0 +1,3 @@",
	"+# Runner",
	"+",
	"+The runner retries each step up to three times.",
	"diff --git a/internal/runner/legacy.go b/internal/runner/legacy.go",
	"deleted file mode 100644",
	"--- a/internal/runner/legacy.go",
	"+++ /dev/null",
	"@@ -1,3 +0,0 @@",
	"-package runner",
	"-",
	"-// Deprecated: use Runner.",
	"diff --git a/web/src/old-name.ts b/web/src/new-name.ts",
	"similarity index 100%",
	"rename from web/src/old-name.ts",
	"rename to web/src/new-name.ts",
	"diff --git a/web/public/logo.png b/web/public/logo.png",
	"index 1111111..2222222 100644",
	"Binary files a/web/public/logo.png and b/web/public/logo.png differ",
	"diff --git a/VERSION b/VERSION",
	"index 1111111..2222222 100644",
	"--- a/VERSION",
	"+++ b/VERSION",
	"@@ -1 +1 @@",
	"-1.4.0",
	"\\ No newline at end of file",
	"+1.5.0",
	"\\ No newline at end of file",
].join("\n");

const SINGLE_FILE = [
	"--- a/internal/runner/runner.go",
	"+++ b/internal/runner/runner.go",
	"@@ -12,4 +12,4 @@ func (r *Runner) Run(ctx context.Context) error {",
	" \tif err := r.prepare(ctx); err != nil {",
	"-\t\treturn err",
	'+\t\treturn fmt.Errorf("prepare: %w", err)',
	" \t}",
].join("\n");

const toggled = fn();

/** Several files: modified, added, deleted, renamed, binary, no newline at end. */
export const MultiFile: Story = {
	args: { diff: MULTI_FILE, onFileCollapsedChange: toggled },
};

/** Both modes side by side: added and removed lines stay legible in dark mode. */
export const LightAndDark: Story = {
	args: { diff: MULTI_FILE },
	parameters: { layout: "fullscreen" },
	render: (args) => (
		<Grid templateColumns="1fr" gap="0">
			<LightMode>
				<Box bg="bg-canvas" p="6">
					<DiffView {...args} />
				</Box>
			</LightMode>
			<DarkMode>
				<Box bg="bg-canvas" p="6">
					<DiffView {...args} />
				</Box>
			</DarkMode>
		</Grid>
	),
};

/** A rename with and without content changes. */
export const Rename: Story = {
	args: {
		diff: [
			"diff --git a/src/util.ts b/src/lib/util.ts",
			"similarity index 100%",
			"rename from src/util.ts",
			"rename to src/lib/util.ts",
			"diff --git a/src/a.ts b/src/b.ts",
			"similarity index 80%",
			"rename from src/a.ts",
			"rename to src/b.ts",
			"--- a/src/a.ts",
			"+++ b/src/b.ts",
			"@@ -1,2 +1,2 @@",
			"-export const name = 'a';",
			"+export const name = 'b';",
			" export default name;",
		].join("\n"),
	},
};

/** A binary file has no lines to show. */
export const BinaryFile: Story = {
	args: {
		diff: [
			"diff --git a/assets/font.woff2 b/assets/font.woff2",
			"new file mode 100644",
			"index 0000000..3f2a1b4",
			"Binary files /dev/null and b/assets/font.woff2 differ",
		].join("\n"),
	},
};

/** Files that start collapsed by a predicate, and an action in each header. */
export const CollapsedAndActions: Story = {
	args: {
		diff: MULTI_FILE,
		defaultCollapsed: (file) => file.changeType === "deleted" || file.binary,
		renderFileActions: (file) => (
			<IconButton aria-label={`Open ${file.path}`} size="xs" variant="ghost">
				<ExternalLink />
			</IconButton>
		),
	},
};

/** `contextLines={Infinity}` shows every unchanged line, nothing folded. */
export const NoFolding: Story = {
	args: { diff: MULTI_FILE, contextLines: Number.POSITIVE_INFINITY },
};

/** The compact variant: one file in a detail pane or an inspector. */
export const Compact: Story = {
	args: { diff: SINGLE_FILE, variant: "compact" },
	render: (args) => (
		<Box maxW="420px">
			<DiffView {...args} />
		</Box>
	),
};

/** The compact variant in light and dark mode. */
export const CompactLightAndDark: Story = {
	args: { diff: SINGLE_FILE, variant: "compact" },
	parameters: { layout: "fullscreen" },
	render: (args) => (
		<Grid templateColumns="1fr 1fr" gap="0">
			<LightMode>
				<Box bg="bg-canvas" p="4">
					<DiffView {...args} />
				</Box>
			</LightMode>
			<DarkMode>
				<Box bg="bg-canvas" p="4">
					<DiffView {...args} />
				</Box>
			</DarkMode>
		</Grid>
	),
};

/** An empty diff. */
export const Empty: Story = {
	args: { diff: "" },
};

/** Reviewer findings of one Review Round, as a Change Request view shows them. */
const REVIEW: DiffComment[] = [
	{
		id: "f1",
		path: "internal/runner/runner.go",
		line: 13,
		author: "Reviewer",
		avatar: <Avatar name="Reviewer" size="xs" />,
		timestamp: "14:03",
		tone: "danger",
		label: "Blocking",
		body: "Wrap with %w so callers can still match the cause with errors.Is.",
	},
	{
		id: "f2",
		path: "internal/runner/runner.go",
		line: 13,
		side: "old",
		author: "Reviewer",
		timestamp: "14:03",
		tone: "info",
		label: "Note",
		body: "The bare return lost the step name.",
	},
	{
		id: "f3",
		path: "internal/runner/runner.go",
		line: 22,
		author: "Reviewer",
		timestamp: "14:04",
		tone: "warning",
		label: "Suggestion",
		body: "This unchanged line stays visible because a comment is on it.",
	},
	{
		id: "f4",
		path: "internal/runner/runner.go",
		line: 120,
		author: "Reviewer",
		timestamp: "14:05",
		tone: "warning",
		label: "Suggestion",
		body: "Line 120 is outside the diff's hunks, so this shows at the file level.",
	},
	{
		id: "f5",
		path: "docs/runner.md",
		author: "Reviewer",
		timestamp: "14:06",
		tone: "success",
		label: "Looks good",
		body: "Clear and short.",
	},
	{
		id: "f6",
		path: "internal/runner/runner_test.go",
		line: 8,
		author: "Reviewer",
		timestamp: "14:07",
		tone: "danger",
		label: "Blocking",
		body: "A file the diff does not contain: listed after the files.",
	},
];

/**
 * Comments under their lines (new and old side), at the file level when the
 * line is outside the hunks, and after the files when the file is not in the
 * diff. Focus a file's path, then press `n` / `p` and `j` / `k`.
 */
export const Comments: Story = {
	args: { diff: MULTI_FILE, comments: REVIEW },
};

/** Comments in both modes: tone edges and badges follow the theme. */
export const CommentsLightAndDark: Story = {
	args: { diff: MULTI_FILE, comments: REVIEW },
	parameters: { layout: "fullscreen" },
	render: (args) => (
		<Grid templateColumns="1fr" gap="0">
			<LightMode>
				<Box bg="bg-canvas" p="6">
					<DiffView {...args} />
				</Box>
			</LightMode>
			<DarkMode>
				<Box bg="bg-canvas" p="6">
					<DiffView {...args} />
				</Box>
			</DarkMode>
		</Grid>
	),
};

/** `renderComment` replaces the content; anker keeps the frame and the jumps. */
export const CustomCommentContent: Story = {
	args: {
		diff: SINGLE_FILE,
		comments: REVIEW.slice(0, 2),
		renderComment: (comment) => (
			<Stack gap="1">
				<HStack gap="2">
					<Text fontSize="sm" fontWeight="medium">
						{comment.author}
					</Text>
					<Text fontSize="xs" color="muted">
						{comment.timestamp}
					</Text>
				</HStack>
				<Text fontSize="sm">{comment.body}</Text>
				<Box>
					<Button size="xs" variant="ghost">
						Resolve
					</Button>
				</Box>
			</Stack>
		),
	},
};

/** The compact variant with comments, in light and dark mode. */
export const CompactCommentsLightAndDark: Story = {
	args: { diff: SINGLE_FILE, variant: "compact", comments: REVIEW.slice(0, 2) },
	parameters: { layout: "fullscreen" },
	render: (args) => (
		<Grid templateColumns="1fr 1fr" gap="0">
			<LightMode>
				<Box bg="bg-canvas" p="4">
					<DiffView {...args} />
				</Box>
			</LightMode>
			<DarkMode>
				<Box bg="bg-canvas" p="4">
					<DiffView {...args} />
				</Box>
			</DarkMode>
		</Grid>
	),
};

/**
 * A 5,000-line file: longer than `virtualizeAbove` (500 rows), so it renders
 * in a pane of its own that draws only the rows in view. A change every 40
 * lines leaves unchanged runs to fold; comments sit deep in the file — focus
 * the diff and press `n` to jump to them.
 */
const LARGE_FILE = (() => {
	const lines: string[] = [];
	for (let i = 1; i <= 5000; i++) {
		if (i % 40 === 0) {
			lines.push(`-\tstep(${i});`, `+\tstep(${i}, { retry: true });`);
		} else {
			lines.push(` \tstep(${i});`);
		}
	}
	return [
		"diff --git a/internal/runner/steps.go b/internal/runner/steps.go",
		"index 3b18e51..a3c5d2f 100644",
		"--- a/internal/runner/steps.go",
		"+++ b/internal/runner/steps.go",
		"@@ -1,5000 +1,5000 @@ func steps() {",
		...lines,
	].join("\n");
})();

const LARGE_COMMENTS: DiffComment[] = [
	{
		id: "large-1",
		path: "internal/runner/steps.go",
		line: 1200,
		author: "Reviewer",
		tone: "warning",
		label: "Suggestion",
		body: "Retrying here doubles the step's side effects.",
	},
	{
		id: "large-2",
		path: "internal/runner/steps.go",
		line: 4800,
		author: "Reviewer",
		tone: "danger",
		label: "Blocking",
		body: "This step must not retry: it is not idempotent.",
	},
];

export const LargeDiff: Story = {
	args: {
		diff: `${LARGE_FILE}\n${SINGLE_FILE}`,
		comments: LARGE_COMMENTS,
		contextLines: Number.POSITIVE_INFINITY,
	},
};

/** The large file, its folds and comments in light and dark mode. */
export const LargeDiffLightAndDark: Story = {
	args: { diff: LARGE_FILE, comments: LARGE_COMMENTS },
	parameters: { layout: "fullscreen" },
	render: (args) => (
		<Grid templateColumns="1fr 1fr" gap="0">
			<LightMode>
				<Box bg="bg-canvas" p="4">
					<DiffView {...args} />
				</Box>
			</LightMode>
			<DarkMode>
				<Box bg="bg-canvas" p="4">
					<DiffView {...args} />
				</Box>
			</DarkMode>
		</Grid>
	),
};
