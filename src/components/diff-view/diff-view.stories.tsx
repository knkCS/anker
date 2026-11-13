import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ExternalLink } from "lucide-react";
import { IconButton } from "../../atoms/button";
import { DarkMode, LightMode } from "../../primitives/color-mode";
import { Box, Grid } from "../../primitives/layout";
import { DiffView } from "./diff-view";

/**
 * A unified diff (as `git diff` prints it) rendered per file: path, change
 * type and line counts in the header, old and new line numbers, added and
 * removed lines on the `success` and `danger` palettes, long unchanged runs
 * folded behind an expand control. Click a file's path to collapse it.
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
