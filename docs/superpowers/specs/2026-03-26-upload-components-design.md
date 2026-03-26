# Upload Components — Design Spec

## Problem

Anker has `FileField` (forms layer, requires RHF + react-dropzone) but no standalone upload primitives. Every knkcs app that handles file uploads (mediahub, core CMS, future services) needs: (1) a drag-and-drop zone for file selection, and (2) a floating progress notification for multi-file uploads. These are generic patterns that belong in anker.

## Goal

Add two independent upload components:
1. **UploadDropZone** (components) — standalone drag-and-drop file selection with native HTML5 APIs
2. **UploadToastStack** (feedback) — fixed-position multi-file upload progress notification

---

## UploadDropZone (#48)

### Layer

Components — higher-level standalone composite.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/components/upload-drop-zone.tsx` | Create | Component |
| `src/components/upload-drop-zone.stories.tsx` | Create | Stories |
| `src/components/upload-drop-zone.mdx` | Create | MDX docs |
| `src/components/index.ts` | Modify | Add exports |

### Props

```tsx
export interface UploadDropZoneProps {
	/** Called with selected files after drop or browse. */
	onFiles: (files: File[]) => void;
	/** Called when files are rejected (e.g., exceeds maxSize). */
	onError?: (error: { file: File; reason: "size" | "type" }) => void;
	/** Accepted MIME types or extensions (e.g., "image/*,video/*,.pdf"). */
	accept?: string;
	/** Allow multiple file selection. @default true */
	multiple?: boolean;
	/** Compact mode with reduced padding. @default false */
	compact?: boolean;
	/** Disable the drop zone. */
	disabled?: boolean;
	/** Custom content override. */
	children?: React.ReactNode;
	/** Maximum file size in bytes. Files exceeding this are rejected via onError. */
	maxSize?: number;
	/** Text shown during drag over. @default "Release to upload" */
	dragActiveText?: string;
	/** Instructional text. @default "Drag and drop files here" */
	dropHintText?: string;
	/** Button label. @default "Browse Files" */
	buttonLabel?: string;
}
```

### Behavior

**Default state:**
- Dashed border container (`borderStyle="dashed"`, `borderWidth="2px"`, `borderColor="border"`)
- Upload icon (`Upload` from lucide-react) centered
- Instructional text below icon
- "Browse Files" button (anker `Button` atom, variant="outline")
- Background: `bg.subtle`

**Drag over state:**
- Border color changes to `accent`
- Background changes to `bg.accent-subtle` with reduced opacity
- Text changes to `dragActiveText`

**Compact mode:**
- Reduced padding (`p={3}` instead of `p={6}`)
- Smaller icon (24px instead of 48px)
- Single-line layout

**File validation:**
- `accept`: filter files by MIME type before calling `onFiles`. Rejected files call `onError` with `reason: "type"`.
- `maxSize`: reject files exceeding limit via `onError` with `reason: "size"`. Valid files still passed to `onFiles`.

**Implementation:** Uses native HTML5 drag/drop (`onDragOver`, `onDragLeave`, `onDrop`) and a hidden `<input type="file">` for the browse button. No react-dropzone dependency.

### Component structure

```tsx
export const UploadDropZone: React.FC<UploadDropZoneProps> = (props) => {
	const [isDragActive, setDragActive] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		if (!disabled) setDragActive(true);
	};

	const handleDragLeave = () => setDragActive(false);

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(false);
		if (disabled) return;
		const files = Array.from(e.dataTransfer.files);
		processFiles(files);
	};

	const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		processFiles(files);
		e.target.value = ""; // reset for re-selection of same file
	};

	const processFiles = (files: File[]) => {
		const accepted: File[] = [];
		for (const file of files) {
			if (maxSize && file.size > maxSize) {
				onError?.({ file, reason: "size" });
				continue;
			}
			if (accept && !matchesAccept(file, accept)) {
				onError?.({ file, reason: "type" });
				continue;
			}
			accepted.push(file);
		}
		if (accepted.length > 0) {
			onFiles(multiple ? accepted : [accepted[0]]);
		}
	};

	// ... render dashed border box with drag state, hidden input, browse button
};
```

`matchesAccept` is a module-private helper that checks MIME type or extension against the `accept` string.

### Stories

- `Default` — standard drop zone
- `Compact` — compact={true}
- `Disabled` — disabled={true}
- `WithMaxSize` — maxSize set, onError logs to console
- `CustomContent` — children override with custom layout

---

## UploadToastStack (#49)

### Layer

Feedback — provides user feedback about background upload operations.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/feedback/upload-toast-stack.tsx` | Create | Component |
| `src/feedback/upload-toast-stack.stories.tsx` | Create | Stories |
| `src/feedback/upload-toast-stack.mdx` | Create | MDX docs |
| `src/feedback/index.ts` | Modify | Add exports |

### Types

```tsx
export interface UploadFileStatus {
	id: string;
	filename: string;
	status: "pending" | "uploading" | "processing" | "done" | "error";
	progress?: number;       // 0-100
	error?: string;
}

export interface UploadToastStackProps {
	/** Array of file upload statuses. */
	files: UploadFileStatus[];
	/** Called when the toast is dismissed. */
	onDismiss: () => void;
	/** Auto-dismiss delay in ms after all files complete. 0 to disable. @default 5000 */
	autoDismissMs?: number;
	/** Start expanded. @default true */
	defaultExpanded?: boolean;
}
```

### Behavior

**Layout:**
- Fixed position: `bottom={4}`, `insetInlineEnd={4}`, `zIndex="toast"`
- Floating card: `bg="bg.surface"`, `shadow="lg"`, `rounded="lg"`, `borderWidth="1px"`, `borderColor="border"`
- Width: `320px`

**Header:**
- Overall status text: "Uploading N files..." or "N files uploaded" or "N files failed"
- Collapse/expand chevron toggle
- Close button (X icon)
- Overall progress bar (anker `Progress` primitive)

**Per-file display (when expanded):**
- Filename (truncated via `TruncatedTextCell`'s `truncateText` or just CSS truncation)
- Status icon: `Spinner` (uploading/processing), `Check` (done, green), `AlertCircle` (error, red)
- Progress percentage while uploading
- Error message if failed (red text, `fontSize="xs"`)

**Auto-dismiss:**
- Timer starts when all files are done or error (no pending/uploading/processing)
- Pauses on mouse hover
- Manual dismiss always available via X
- `autoDismissMs={0}` disables auto-dismiss

**Collapse state:**
- Collapsed: header + overall progress only
- Expanded: header + overall progress + per-file list
- Internal `useState(defaultExpanded ?? true)`

### Component structure

```tsx
export const UploadToastStack: React.FC<UploadToastStackProps> = (props) => {
	const [expanded, setExpanded] = useState(defaultExpanded ?? true);
	const [hovered, setHovered] = useState(false);

	const allComplete = files.every(f => f.status === "done" || f.status === "error");
	const totalProgress = /* calculate weighted average */;
	const doneCount = files.filter(f => f.status === "done").length;
	const errorCount = files.filter(f => f.status === "error").length;

	// Auto-dismiss timer
	useEffect(() => {
		if (!allComplete || hovered || autoDismissMs === 0) return;
		const timer = setTimeout(onDismiss, autoDismissMs);
		return () => clearTimeout(timer);
	}, [allComplete, hovered, autoDismissMs, onDismiss]);

	if (files.length === 0) return null;

	// ... render fixed-position card with header, progress, file list
};
```

### Dependencies

- `Box`, `Flex`, `HStack`, `Stack`, `Text` from `@chakra-ui/react`
- `Progress` from `../../primitives/progress`
- `Spinner` from `../../primitives/spinner`
- `IconButton` from `../../atoms/button`
- `Check`, `AlertCircle`, `ChevronDown`, `ChevronUp`, `X` from `lucide-react`
- `useState`, `useEffect` from React

### Stories

- `Uploading` — 3 files: 1 uploading (60%), 1 pending, 1 done
- `AllDone` — 3 files all done
- `WithErrors` — 3 files: 1 done, 1 error with message, 1 done
- `Collapsed` — defaultExpanded={false}
- `SingleFile` — 1 file uploading

---

## Public API

New exports from `@knkcs/anker/components`:
- `UploadDropZone`, `UploadDropZoneProps`

New exports from `@knkcs/anker/feedback`:
- `UploadToastStack`, `UploadToastStackProps`, `UploadFileStatus`

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Storybook: all stories render correctly for both components
