# ColorSwatchPicker — Design Spec

## Problem

Anker has `ColorPickerField` (forms, requires RHF + react-colorful) but no standalone color selection widget. Every knkcs app that manages colors (status colors, tag colors, org branding) needs a simple preset swatch picker without the overhead of a full color picker library.

## Goal

Add `ColorSwatchPicker` to the atoms layer — a controlled component with preset color swatches, optional hex input, and optional preview box.

## Design

### Layer

Atoms — small reusable UI unit, same category as `DateInput` and `Select`.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/atoms/color-swatch-picker/color-swatch-picker.tsx` | Create | Component |
| `src/atoms/color-swatch-picker/index.ts` | Create | Barrel |
| `src/atoms/color-swatch-picker/color-swatch-picker.stories.tsx` | Create | Stories |
| `src/atoms/color-swatch-picker/color-swatch-picker.mdx` | Create | MDX docs |
| `src/atoms/index.ts` | Modify | Add exports |

### Props

```tsx
export interface ColorSwatchPickerProps {
	/** Current hex color (e.g., "#3b82f6"). */
	value?: string;
	/** Called when a color is selected. */
	onChange: (color: string) => void;
	/** Preset hex colors. Uses built-in palette if omitted. */
	presets?: string[];
	/** Show hex text input for arbitrary colors. @default false */
	showHexInput?: boolean;
	/** Show color preview box next to hex input. @default false */
	showPreview?: boolean;
	/** Swatch size. @default "md" */
	size?: "sm" | "md" | "lg";
}
```

### Default presets

```tsx
const DEFAULT_PRESETS = [
	"#3b82f6", // blue
	"#10b981", // green
	"#f59e0b", // amber
	"#ef4444", // red
	"#8b5cf6", // violet
	"#ec4899", // pink
	"#14b8a6", // teal
	"#6b7280", // gray
];
```

### Component structure

```tsx
export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
	value,
	onChange,
	presets = DEFAULT_PRESETS,
	showHexInput = false,
	showPreview = false,
	size = "md",
}) => {
	const [hexInput, setHexInput] = useState(value ?? "");

	// Sync hex input when value changes externally
	useEffect(() => {
		setHexInput(value ?? "");
	}, [value]);

	const swatchSize = size === "sm" ? 4 : size === "lg" ? 7 : 5;

	const handleHexSubmit = () => {
		const trimmed = hexInput.trim();
		if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
			onChange(trimmed);
		}
	};

	return (
		<Stack gap={3}>
			<Flex wrap="wrap" gap={2}>
				{presets.map((color) => (
					<Box
						key={color}
						w={swatchSize}
						h={swatchSize}
						rounded="sm"
						bg={color}
						cursor="pointer"
						borderWidth="2px"
						borderColor={value === color ? "border.emphasized" : "transparent"}
						onClick={() => onChange(color)}
						_hover={{ transform: "scale(1.1)" }}
						transition="transform 0.1s"
					/>
				))}
			</Flex>
			{(showHexInput || showPreview) && (
				<HStack gap={2}>
					{showPreview && (
						<Box
							w={9}
							h={9}
							rounded="md"
							bg={value || "transparent"}
							borderWidth="1px"
							borderColor="border"
							flexShrink={0}
						/>
					)}
					{showHexInput && (
						<TextInput
							value={hexInput}
							onChange={(e) => setHexInput(e.target.value)}
							onBlur={handleHexSubmit}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleHexSubmit();
							}}
							placeholder="#000000"
							size="sm"
							maxW="120px"
						/>
					)}
				</HStack>
			)}
		</Stack>
	);
};
ColorSwatchPicker.displayName = "ColorSwatchPicker";
```

### Dependencies

- `Box`, `Flex`, `HStack`, `Stack` from `@chakra-ui/react` (layout primitives)
- `TextInput` from `../text-input` (atoms)
- `useState`, `useEffect` from React

### Swatch sizes

| Size | Token | Pixels |
|------|-------|--------|
| `sm` | 4 | 16px |
| `md` | 5 | 20px |
| `lg` | 7 | 28px |

### Hex input validation

- Accepts 6-digit hex with `#` prefix: `/^#[0-9a-fA-F]{6}$/`
- Validates on blur and Enter
- Invalid input: no change, input retains the typed value for correction
- Does not accept 3-digit shorthand, rgb(), or named colors — hex only

### Stories

- `Default` — preset swatches only, controlled
- `WithHexInput` — presets + hex text input
- `WithPreview` — presets + hex input + preview box
- `CustomPresets` — custom color array
- `SmallSize` — `size="sm"`
- `NullValue` — no initial selection

### Exports

Add to `src/atoms/index.ts` (alphabetically, after `clipboard`):
```ts
// ColorSwatchPicker
export {
	ColorSwatchPicker,
	type ColorSwatchPickerProps,
} from "./color-swatch-picker";
```

## Public API

New export from `@knkcs/anker/atoms`: `ColorSwatchPicker` and `ColorSwatchPickerProps`.

## Integration with RHF

Works as a controlled component. Consumers wrap with `Controller`:
```tsx
<Controller
	name="color"
	control={control}
	render={({ field }) => (
		<ColorSwatchPicker value={field.value} onChange={field.onChange} showHexInput />
	)}
/>
```

A dedicated `ColorSwatchPickerField` form wrapper can be added later if demand warrants it (see #57).

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Storybook: all 6 stories render correctly, swatch selection works, hex input validates
