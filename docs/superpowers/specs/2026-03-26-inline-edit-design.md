# InlineEdit — Design Spec

## Problem

Anker has `EditableHeading` — a click-to-edit component hardcoded for headings (fontSize "3xl", single-line only). The template service and mediahub need the same pattern for body text and multi-line content. Rather than creating a parallel component, we enhance and rename `EditableHeading` to `InlineEdit` with textarea support and empty-value control.

## Goal

Replace `EditableHeading` with `InlineEdit` — a generalized click-to-edit component supporting both single-line input and multi-line textarea, with configurable defaults. Hard rename (no backwards compat — anker is WIP with no consumers).

## Design

### Layer

Forms — same location as current `EditableHeading`. Not an RHF field, but the forms layer already contains non-field value-editing utilities.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/forms/inline-edit.tsx` | Create | New component using Chakra v3 Editable |
| `src/forms/inline-edit.stories.tsx` | Create | Stories: input, textarea, disabled, allowEmpty |
| `src/forms/inline-edit.mdx` | Create | MDX documentation |
| `src/forms/index.ts` | Modify | Replace EditableHeading exports with InlineEdit |
| `src/forms/editable-heading.tsx` | Delete | Replaced by InlineEdit |
| `src/forms/editable-heading.stories.tsx` | Delete | Replaced by InlineEdit stories |

### Props

```tsx
export interface InlineEditProps {
	/** Current value. */
	value?: string;
	/** Called when the value is committed (blur, Enter for input). */
	onSubmit?: (nextValue: string) => void;
	/** Called on every keystroke. */
	onChange?: (nextValue: string) => void;
	/** Called when edit is cancelled (Escape). */
	onCancel?: (previousValue: string) => void;
	/** Edit mode variant. @default "input" */
	variant?: "input" | "textarea";
	/** Placeholder text shown in edit mode. */
	placeholder?: string;
	/** Font size for both preview and edit. @default "md" */
	fontSize?: string;
	/** Font weight for both preview and edit. */
	fontWeight?: string;
	/** Max width constraint. */
	maxW?: string;
	/** Disable editing. */
	disabled?: boolean;
	/** Whether to allow submitting an empty string. @default false */
	allowEmpty?: boolean;
	/** Number of rows for textarea variant. @default 3 */
	rows?: number;
	/** Aria label for the edit button. @default "Edit" */
	editLabel?: string;
}
```

### Component structure

```tsx
import {
	ButtonGroup,
	Editable,
	IconButton,
	useEditableContext,
} from "@chakra-ui/react";
import { Pencil } from "lucide-react";

const EditControls = ({ editLabel }: { editLabel: string }) => {
	const { editing } = useEditableContext();
	if (editing) return null;
	return (
		<ButtonGroup>
			<Editable.EditTrigger asChild>
				<IconButton variant="ghost" marginInlineStart={2} aria-label={editLabel}>
					<Pencil size={16} />
				</IconButton>
			</Editable.EditTrigger>
		</ButtonGroup>
	);
};

/**
 * Handles allowEmpty validation inside Editable.Root context.
 * Must be a child of Editable.Root because it needs useEditableContext
 * to call cancel() — onValueCommit is a post-commit notification and
 * cannot prevent the commit.
 */
const CommitGuard = ({
	allowEmpty,
	onSubmit,
}: {
	allowEmpty: boolean;
	onSubmit?: (value: string) => void;
}) => {
	const { cancel } = useEditableContext();

	// Register as onValueCommit handler via context effect
	// The actual wiring is done via onValueCommit on Editable.Root,
	// which calls this component's handler through a ref/callback.
	// See implementation note below.
	return null;
};

export const InlineEdit = ({
	value,
	onSubmit,
	onChange,
	onCancel,
	variant = "input",
	placeholder,
	fontSize = "md",
	fontWeight,
	maxW,
	disabled,
	allowEmpty = false,
	rows = 3,
	editLabel = "Edit",
}: InlineEditProps) => {
	// Store cancel function from context for use in onValueCommit
	const cancelRef = useRef<(() => void) | null>(null);

	const handleSubmit = (details: { value: string }) => {
		const trimmed = details.value.trim();
		if (!allowEmpty && trimmed === "") {
			cancelRef.current?.();
			return;
		}
		onSubmit?.(trimmed);
	};

	return (
		<Editable.Root
			fontSize={fontSize}
			fontWeight={fontWeight}
			maxW={maxW}
			value={String(value ?? "")}
			onValueChange={(details) => onChange?.(details.value)}
			onValueRevert={(details) => onCancel?.(details.value)}
			onValueCommit={handleSubmit}
			disabled={disabled}
			placeholder={placeholder}
		>
			<CancelRefCapture cancelRef={cancelRef} />
			<Editable.Preview />
			{variant === "textarea" ? (
				<Editable.Textarea minH={`${rows * 1.5}em`} />
			) : (
				<Editable.Input />
			)}
			<EditControls editLabel={editLabel} />
		</Editable.Root>
	);
};
InlineEdit.displayName = "InlineEdit";

/** Captures the cancel function from Editable context into a ref. */
const CancelRefCapture = ({
	cancelRef,
}: { cancelRef: React.MutableRefObject<(() => void) | null> }) => {
	const { cancel } = useEditableContext();
	cancelRef.current = cancel;
	return null;
};
```

**Implementation notes:**
- `allowEmpty` revert uses `cancel()` from `useEditableContext`, which must be accessed inside a descendant of `Editable.Root`. A `CancelRefCapture` helper component captures the function into a ref that `handleSubmit` can call.
- `onValueCommit` is a post-commit notification — it cannot prevent the commit. Calling `cancel()` after commit forces the state machine back to the previous value.
- `Editable.Textarea` may not accept `rows` as an HTML attribute through Chakra's typing. Use `minH` instead (e.g., `minH={rows * 1.5}em`) for reliable multi-line sizing. Verify with typecheck during implementation.
- `onSubmit` receives the trimmed value. This is a documented behavioral choice — inline edits should never submit leading/trailing whitespace.

### Behavior

- **Display mode:** Renders value as `Editable.Preview` (plain text). Pencil icon appears next to text. Click text or pencil to enter edit mode.
- **Edit mode (input):** Single-line input. Save on blur or Enter. Cancel on Escape.
- **Edit mode (textarea):** Multi-line textarea. Save on blur. Cancel on Escape. Enter adds newline (standard textarea behavior).
- **allowEmpty:** When false (default), submitting an empty/whitespace-only value reverts instead of calling `onSubmit`.
- **disabled:** Chakra's `Editable.Root` accepts `disabled` — prevents entering edit mode, dims the control.

### Changes to index.ts

Remove:
```ts
export { EditableHeading, type EditableHeadingProps } from "./editable-heading";
```

Add:
```ts
export { InlineEdit, type InlineEditProps } from "./inline-edit";
```

### Changes to CLAUDE.md

Update the forms description if it mentions `EditableHeading` specifically.

## Public API

**Breaking change:** `EditableHeading` and `EditableHeadingProps` removed from `@knkcs/anker/forms`. Use `InlineEdit` and `InlineEditProps` instead.

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Storybook: InlineEdit stories render correctly (input default, textarea, disabled, allowEmpty variants)
