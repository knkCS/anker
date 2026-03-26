# Upload Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement UploadDropZone (components) and UploadToastStack (feedback) for standalone file upload flows.

**Architecture:** UploadDropZone uses native HTML5 drag/drop APIs (no react-dropzone) with file validation via `onError` callback. UploadToastStack is a fixed-position floating card with per-file progress, collapsible state, and auto-dismiss timer. Both are independent with no cross-dependency.

**Tech Stack:** React state, native HTML5 drag/drop, Chakra UI v3, lucide-react icons

**Spec:** `docs/superpowers/specs/2026-03-26-upload-components-design.md`

---

## File Map

| File | Action | Component |
|------|--------|-----------|
| `src/components/upload-drop-zone.tsx` | Create | UploadDropZone |
| `src/components/upload-drop-zone.stories.tsx` | Create | UploadDropZone |
| `src/components/upload-drop-zone.mdx` | Create | UploadDropZone |
| `src/components/index.ts` | Modify | UploadDropZone exports |
| `src/feedback/upload-toast-stack.tsx` | Create | UploadToastStack |
| `src/feedback/upload-toast-stack.stories.tsx` | Create | UploadToastStack |
| `src/feedback/upload-toast-stack.mdx` | Create | UploadToastStack |
| `src/feedback/index.ts` | Modify | UploadToastStack exports |

---

### Task 1: UploadDropZone (#48)

**Files:**
- Create: `src/components/upload-drop-zone.tsx`
- Create: `src/components/upload-drop-zone.stories.tsx`
- Create: `src/components/upload-drop-zone.mdx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Create upload-drop-zone.tsx**

Component with native HTML5 drag/drop. Key points:

- `useState` for `isDragActive`
- `useRef<HTMLInputElement>` for hidden file input
- `onDragOver` → `preventDefault` + set active
- `onDragLeave` → unset active
- `onDrop` → `preventDefault`, extract `e.dataTransfer.files`, process
- `processFiles` validates each file against `maxSize` and `accept`, calls `onError` for rejected files, calls `onFiles` with accepted files
- `matchesAccept(file, accept)` — module-private helper that splits the `accept` string by commas and checks each token against `file.type` (MIME match) or `file.name` (extension match)
- Hidden `<input type="file">` with `accept` and `multiple` props, triggered by "Browse Files" button
- Reset input value after selection (`e.target.value = ""`) to allow re-selecting the same file
- `compact` mode: `p={3}`, icon size 24, single-line text
- Default mode: `p={6}`, icon size 48, multi-line with button

Visual:
- Outer box: `borderStyle="dashed"`, `borderWidth="2px"`, `borderColor={isDragActive ? "accent" : "border"}`, `bg={isDragActive ? "bg.accent-subtle" : "bg.subtle"}`, `rounded="lg"`, `textAlign="center"`, `transition="all 0.2s"`
- Upload icon from lucide-react
- Text: `color="fg.muted"`, `fontSize="sm"`
- Button: anker `Button` atom, `variant="outline"`, `size="sm"`
- Disabled: `opacity={0.5}`, `cursor="not-allowed"`, ignore all drag events
- Children override: if `children` is provided, render it instead of default content

Props per spec. Set `UploadDropZone.displayName = "UploadDropZone"`.

- [ ] **Step 2: Create upload-drop-zone.stories.tsx**

Title: `"Components/UploadDropZone"`, `satisfies Meta<typeof UploadDropZone>`.

Stories:
- `Default` — `onFiles` logs to console
- `Compact` — `compact={true}`
- `Disabled` — `disabled={true}`
- `WithMaxSize` — `maxSize={1024 * 1024}` (1MB), `onError` logs rejection
- `CustomContent` — children with custom layout (icon + custom text)

- [ ] **Step 3: Create upload-drop-zone.mdx**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./upload-drop-zone.stories";

<Meta of={Stories} />

# UploadDropZone

Drag-and-drop file selection with click-to-browse fallback. Uses native HTML5 drag/drop — no react-dropzone dependency.

## Usage

<Canvas of={Stories.Default} />

## Compact

<Canvas of={Stories.Compact} />

## With File Size Limit

<Canvas of={Stories.WithMaxSize} />

## Props

<ArgTypes of={Stories} />
```

- [ ] **Step 4: Add to components/index.ts**

Read the file. Add before the `// Widget` section:

```ts
// UploadDropZone
export type { UploadDropZoneProps } from "./upload-drop-zone";
export { UploadDropZone } from "./upload-drop-zone";
```

- [ ] **Step 5: Verify and commit**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
All must pass.

```bash
git add src/components/upload-drop-zone.tsx src/components/upload-drop-zone.stories.tsx src/components/upload-drop-zone.mdx src/components/index.ts
git commit -m "feat(components): add UploadDropZone for drag-and-drop file selection

Standalone drop zone with native HTML5 drag/drop, file validation
(maxSize, accept), onError callback, and compact mode.

Closes #48"
```

---

### Task 2: UploadToastStack (#49)

**Files:**
- Create: `src/feedback/upload-toast-stack.tsx`
- Create: `src/feedback/upload-toast-stack.stories.tsx`
- Create: `src/feedback/upload-toast-stack.mdx`
- Modify: `src/feedback/index.ts`

- [ ] **Step 1: Create upload-toast-stack.tsx**

Fixed-position floating progress card. Key points:

Types:
```tsx
export interface UploadFileStatus {
	id: string;
	filename: string;
	status: "pending" | "uploading" | "processing" | "done" | "error";
	progress?: number;
	error?: string;
}
```

State:
- `useState(defaultExpanded ?? true)` for collapse
- `useState(false)` for hover
- `useEffect` for auto-dismiss timer (starts when all complete, clears on hover)

Computed:
- `allComplete` = every file is "done" or "error"
- `totalProgress` = weighted average of all file progress values
- `doneCount`, `errorCount` for header text
- Header text: "Uploading N files..." | "N files uploaded" | "N files uploaded, M failed"

Layout:
- Fixed position: `position="fixed"`, `bottom={4}`, `insetInlineEnd={4}`, `zIndex="toast"`
- Card: `bg="bg.surface"`, `shadow="lg"`, `rounded="lg"`, `borderWidth="1px"`, `borderColor="border"`, `w="320px"`
- Header row: status text + chevron toggle + X close button
- Overall progress: anker `Progress` primitive
- Per-file list (when expanded): filename (CSS truncated), status icon, progress %, error text

Per-file status icons:
- "pending": `Clock` icon (muted)
- "uploading"/"processing": `Spinner` primitive (accent color)
- "done": `Check` icon (green)
- "error": `AlertCircle` icon (red)

Auto-dismiss:
- `useEffect` watches `allComplete`, `hovered`, `autoDismissMs`
- When `allComplete && !hovered && autoDismissMs > 0`: `setTimeout(onDismiss, autoDismissMs)`
- Cleanup clears timeout
- `onMouseEnter` → `setHovered(true)`, `onMouseLeave` → `setHovered(false)`

Return `null` when `files.length === 0`.

Uses:
- `Box`, `Flex`, `HStack`, `Stack`, `Text` from `@chakra-ui/react`
- `Progress` from `../../primitives/progress`
- `Spinner` from `../../primitives/spinner`
- `IconButton` from `../../atoms/button`
- `Check`, `AlertCircle`, `ChevronDown`, `ChevronUp`, `Clock`, `X` from `lucide-react`

Set `UploadToastStack.displayName = "UploadToastStack"`.

- [ ] **Step 2: Create upload-toast-stack.stories.tsx**

Title: `"Feedback/UploadToastStack"`, `satisfies Meta<typeof UploadToastStack>`.

Stories (use static data, no real uploads — `autoDismissMs={0}` to prevent dismiss during dev):

- `Uploading` — 3 files: `{ status: "done", progress: 100 }`, `{ status: "uploading", progress: 60 }`, `{ status: "pending" }`
- `AllDone` — 3 files all `{ status: "done", progress: 100 }`
- `WithErrors` — 3 files: 1 done, 1 error with `error: "Network timeout"`, 1 done
- `Collapsed` — `defaultExpanded={false}`, 2 files uploading
- `SingleFile` — 1 file uploading at 45%

All stories: `onDismiss={() => console.log("Dismissed")}`, `autoDismissMs={0}`.

- [ ] **Step 3: Create upload-toast-stack.mdx**

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as Stories from "./upload-toast-stack.stories";

<Meta of={Stories} />

# UploadToastStack

Fixed-position toast notification showing multi-file upload progress with expandable per-file status.

## Uploading

<Canvas of={Stories.Uploading} />

## Completed

<Canvas of={Stories.AllDone} />

## With Errors

<Canvas of={Stories.WithErrors} />

## Props

<ArgTypes of={Stories} />
```

- [ ] **Step 4: Add to feedback/index.ts**

Read `src/feedback/index.ts`. Add after the existing ConfirmModal exports:

```ts
export {
	UploadToastStack,
	type UploadFileStatus,
	type UploadToastStackProps,
} from "./upload-toast-stack";
```

- [ ] **Step 5: Verify and commit**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
All must pass.

```bash
git add src/feedback/upload-toast-stack.tsx src/feedback/upload-toast-stack.stories.tsx src/feedback/upload-toast-stack.mdx src/feedback/index.ts
git commit -m "feat(feedback): add UploadToastStack for multi-file upload progress

Fixed-position floating toast with per-file status, collapsible
file list, overall progress bar, and auto-dismiss with hover pause.

Closes #49"
```

---

### Task 3: Push

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```
