# Migrate Chakra Direct Imports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all direct `@chakra-ui/react` imports in atoms/components/forms/feedback/stories when an Anker primitive or atom wrapper exists, enforcing the CLAUDE.md import rule strictly.

**Architecture:** Purely mechanical migration — for each file, split the Chakra import into: (1) components with Anker wrappers → import from Anker primitives/atoms, (2) components without wrappers → keep as Chakra import. No behavioral changes, no API changes.

**Tech Stack:** TypeScript, Chakra UI v3, relative imports

---

## Migration Rule

For every import from `@chakra-ui/react`, check each imported name:

**Has Anker wrapper (MIGRATE to relative Anker import):**
- Layout: `Box`, `Center`, `Container`, `Flex`, `Grid`, `GridItem`, `HStack`, `Spacer`, `Stack`, `VStack` → from primitives `layout`
- Typography: `Text`, `Heading`, `Code`, `Link` + their Props types → from primitives `typography`
- `Badge`, `BadgeProps` → from primitives `badge`
- `Checkbox`, `CheckboxGroup` → from primitives `checkbox`
- `Collapsible` → from primitives `collapsible`
- `Separator`, `SeparatorProps` → from primitives `separator`
- `Table` → from primitives `table`
- `Textarea`, `TextareaProps` → from primitives `textarea`
- `RadioGroup` → from primitives `radio`
- `Button` (atom) → from atoms `button/button`
- `IconButton` (atom) → from atoms `button/icon-button`

**No Anker wrapper (KEEP as `@chakra-ui/react` import):**
- `ButtonGroup`, `Portal`, `Dialog`, `Drawer` (compound), `Editable`, `useEditableContext`
- `Icon`, `Circle`, `Square`, `AbsoluteCenter`, `Span`, `ClientOnly`
- `Field`, `Input`, `InputGroup`, `InputAddon`, `Group`
- `chakra` factory, `HTMLChakraProps`, `SystemStyleObject`, `useSlotRecipe`, `useRecipe`, `createContext`
- Type-only imports: `InputProps`, `ButtonProps`, `NativeSelectFieldProps`, `DialogRootProps`, `DrawerRootProps`, `CardRootProps`, `TextProps`, `SpanProps`, `IconButtonProps`
- `ChakraProvider`, `defaultSystem`, `createTreeCollection`, `Clipboard`

**Excluded from migration (they ARE the wrappers):**
- All files in `src/primitives/` — they must import from Chakra
- All files in `src/theme/` — infrastructure
- Wrapper source files: `atoms/button/button.tsx`, `atoms/button/icon-button.tsx`, `atoms/data-list/data-list.tsx`, `atoms/text-input/text-input.tsx`, `atoms/persona/persona.tsx`, `atoms/date-input/date-input.tsx`, `atoms/checkbox-card/checkbox-card.tsx`

---

## File Map

### Task 1 — Atoms source files

| File | Currently imports from Chakra | Migrate to Anker | Keep as Chakra |
|------|------|------|------|
| `atoms/comment/comment-reply-box.tsx` | Box, Button, ButtonGroup, Flex, Textarea | Box→layout, Flex→layout, Textarea→textarea | Button→atoms/button, ButtonGroup stays |
| `atoms/comment/comment.tsx` | chakra, HStack, Stack | HStack→layout, Stack→layout | chakra stays |
| `atoms/status-badge/status-badge.tsx` | Badge | Badge→badge | — |
| `atoms/type-badge/type-badge.tsx` | Badge, BadgeProps | Badge,BadgeProps→badge | — |
| `atoms/empty-state/empty-state.tsx` | Heading, Stack, Text | All→typography+layout | — |
| `atoms/stat/stat.tsx` | Box, Heading, HStack, Square, Stack, Text | Box,HStack,Stack→layout, Heading,Text→typography | Square stays |
| `atoms/text-overflow/text-overflow.tsx` | Text, TextProps | Text,TextProps→typography | — |
| `atoms/actions/action.tsx` | Box | Box→layout | — |
| `atoms/actions/filter.tsx` | Box, Circle, Text | Box→layout, Text→typography | Circle stays |
| `atoms/actions/edit.tsx` | Icon | — | Icon stays |
| `atoms/actions/handle.tsx` | Icon | — | Icon stays |
| `atoms/actions/remove.tsx` | Icon | — | Icon stays |
| `atoms/actions/collapse.tsx` | Icon | — | Icon stays |
| `atoms/color-swatch-picker/color-swatch-picker.tsx` | Box, Flex, HStack, Stack | All→layout | — |
| `atoms/select/base-select.tsx` | Circle, HStack, Text | HStack→layout, Text→typography | Circle stays |
| `atoms/select/table-menu-list.tsx` | Box, Table | Box→layout, Table→table | — |
| `atoms/split-button/split-button.tsx` | HStack | HStack→layout | — |
| `atoms/clipboard/clipboard.tsx` | Clipboard, IconButton, Input | — | All stay (Clipboard compound, no Anker wrapper for raw Input) |

### Task 2 — Components source files

| File | Currently imports from Chakra | Migrate to Anker | Keep as Chakra |
|------|------|------|------|
| `components/widget.tsx` | Box, Card, Flex, Text | Box,Flex→layout, Text→typography | Card stays (Card atom is a different wrapper) |
| `components/card.tsx` | Card as ChakraCard, CardRootProps, Heading | Heading→typography | ChakraCard, CardRootProps stay (IS the wrapper) |
| `components/card-list.tsx` | Box, Flex, Grid, GridItem | All→layout | — |
| `components/card-list-data.tsx` | Text, TextProps | Text→typography | TextProps stays as type |
| `components/card-list-item.tsx` | Box, Flex, Grid, GridItem, Menu, Portal | Box,Flex,Grid,GridItem→layout | Menu, Portal stay |
| `components/pagination.tsx` | HStack, Text | HStack→layout, Text→typography | — |
| `components/modal.tsx` | Dialog, DialogRootProps, Flex, Portal, Separator, Spacer | Flex,Spacer→layout, Separator→separator | Dialog, DialogRootProps, Portal stay |
| `components/drawer.tsx` | Drawer, DrawerRootProps, Flex, Portal, Spacer | Flex,Spacer→layout | Drawer, DrawerRootProps, Portal stay |
| `components/fact-box.tsx` | Box, ButtonGroup, CardRootProps, Collapsible, Flex, HStack, Text | Box,Flex,HStack→layout, Text→typography, Collapsible→collapsible | ButtonGroup, CardRootProps stay |
| `components/upload-drop-zone.tsx` | Box, HStack, Stack, Text | Box,HStack,Stack→layout, Text→typography | — |
| `components/chip-picker/chip-picker.tsx` | Box, Flex, Text | Box,Flex→layout, Text→typography | — |
| `components/inline-creatable-list/inline-creatable-list.tsx` | Box, Flex, Stack, Text | Box,Flex,Stack→layout, Text→typography | — |
| `components/bulk-action-bar/bulk-action-bar.tsx` | Collapsible, Flex, HStack, Text | Flex,HStack→layout, Text→typography, Collapsible→collapsible | — |
| `components/sidebar-section.tsx` | Box, Flex, Text | Box,Flex→layout, Text→typography | — |
| `components/labeled-switch.tsx` | Box, Flex, Text | Box,Flex→layout, Text→typography | — |
| `components/selectable-card/selectable-card.tsx` | Box, Flex | Box,Flex→layout | — |
| `components/data-table/data-table.tsx` | Box, Checkbox, Flex, Table, Text | Box,Flex→layout, Checkbox→checkbox, Table→table, Text→typography | — |
| `components/stepper/stepper.tsx` | Collapsible, chakra, HTMLChakraProps, SystemStyleObject, useSlotRecipe | Collapsible→collapsible | chakra, HTMLChakraProps, SystemStyleObject, useSlotRecipe stay |

### Task 3 — Forms source files

| File | Currently imports from Chakra | Migrate to Anker | Keep as Chakra |
|------|------|------|------|
| `forms/textarea-field.tsx` | Textarea, TextareaProps | Textarea,TextareaProps→textarea | — |
| `forms/input-field.tsx` | InputProps (type) | — | InputProps stays (type, no wrapper) |
| `forms/checkbox-field.tsx` | Checkbox, Field | Checkbox→checkbox | Field stays |
| `forms/radio-group-field.tsx` | RadioGroup, RadioGroupRootProps, Stack | RadioGroup→radio, Stack→layout | RadioGroupRootProps stays (type) |
| `forms/form-field.tsx` | Field, HStack, Text | HStack→layout, Text→typography | Field stays |
| `forms/controlled-form-field.tsx` | Field, HStack | HStack→layout | Field stays |
| `forms/file-field.tsx` | Box, Button, Flex, Text | Box,Flex→layout, Text→typography | Button stays (no Anker Button import in forms — uses Chakra Button directly) |
| `forms/array-field.tsx` | Box, Button, ButtonGroup, Grid, GridItem, IconButton, Input, Stack, Text | Box,Grid,GridItem,Stack→layout, Text→typography | Button, ButtonGroup, IconButton, Input stay |
| `forms/color-picker-field.tsx` | ButtonProps, IconButton, Square | — | All stay (ButtonProps type, Square no wrapper) |
| `forms/inline-edit.tsx` | ButtonGroup, Editable, IconButton, useEditableContext | — | All stay (no wrappers) |

### Task 4 — Feedback source files

| File | Currently imports from Chakra | Migrate to Anker | Keep as Chakra |
|------|------|------|------|
| `feedback/confirm-modal.tsx` | Button, ButtonGroup, ButtonProps, Dialog, Portal | — | All stay (wrapper for Dialog) |
| `feedback/upload-toast-stack.tsx` | Box, Flex, HStack, Stack, Text | Box,Flex,HStack,Stack→layout, Text→typography | — |

### Task 5 — Story files (all layers)

All `.stories.tsx` files that import layout/typography from `@chakra-ui/react` should migrate to Anker primitives. This covers ~30 files. The pattern is identical: replace `import { Box, Text, Stack } from "@chakra-ui/react"` with imports from relative paths to primitives.

### Task 6 — Verify and commit

Run typecheck, lint, and build:storybook to confirm zero regressions.

---

## Import Path Reference

From **atoms/** files:
```ts
import { Box, Flex, HStack, Stack, Spacer } from "../primitives/layout";  // or ../../primitives/layout
import { Text, Heading } from "../primitives/typography";  // or ../../primitives/typography
import { Badge } from "../primitives/badge";
import { Separator } from "../primitives/separator";
import { Table } from "../primitives/table";
import { Textarea } from "../primitives/textarea";
import { Collapsible } from "../primitives/collapsible";
import { Checkbox } from "../primitives/checkbox";
import { RadioGroup } from "../primitives/radio";
```

From **components/** files:
```ts
import { Box, Flex, HStack, Stack, Grid, GridItem, Spacer } from "../primitives/layout";
import { Text, Heading } from "../primitives/typography";
// etc — same primitives, different relative paths
```

From **forms/** files:
```ts
import { HStack, Stack, Box, Grid, GridItem } from "../primitives/layout";
import { Text } from "../primitives/typography";
import { Checkbox } from "../primitives/checkbox";
import { Textarea } from "../primitives/textarea";
import { RadioGroup } from "../primitives/radio";
```

From **stories/** files:
Use appropriate relative paths based on depth (e.g., `../../primitives/layout` from `atoms/button/button.stories.tsx`).

---

### Task 1: Migrate atoms source files

**Files:** 17 files in `src/atoms/` (excluding wrapper files and files with only non-wrapped imports)

- [ ] **Step 1: Migrate each atom source file**

For each file listed in the Task 1 table above, split the `@chakra-ui/react` import into Anker primitive imports and (if needed) a remaining Chakra import for non-wrapped components.

Example transformation for `atoms/empty-state/empty-state.tsx`:
```ts
// Before:
import { Heading, Stack, Text } from "@chakra-ui/react";

// After:
import { Stack } from "../../primitives/layout";
import { Heading, Text } from "../../primitives/typography";
```

Example transformation for `atoms/stat/stat.tsx` (mixed):
```ts
// Before:
import { Box, Heading, HStack, Square, Stack, Text } from "@chakra-ui/react";

// After:
import { Square } from "@chakra-ui/react";
import { Box, HStack, Stack } from "../../primitives/layout";
import { Heading, Text } from "../../primitives/typography";
```

Files with NO wrapped imports (skip — no changes needed):
- `atoms/actions/edit.tsx` (only Icon)
- `atoms/actions/handle.tsx` (only Icon)
- `atoms/actions/remove.tsx` (only Icon)
- `atoms/actions/collapse.tsx` (only Icon)
- `atoms/clipboard/clipboard.tsx` (only Clipboard compound, IconButton, Input — none wrapped at this level)

Files to migrate (12 files):
- `atoms/comment/comment-reply-box.tsx`
- `atoms/comment/comment.tsx`
- `atoms/status-badge/status-badge.tsx`
- `atoms/type-badge/type-badge.tsx`
- `atoms/empty-state/empty-state.tsx`
- `atoms/stat/stat.tsx`
- `atoms/text-overflow/text-overflow.tsx`
- `atoms/actions/action.tsx`
- `atoms/actions/filter.tsx`
- `atoms/color-swatch-picker/color-swatch-picker.tsx`
- `atoms/select/base-select.tsx`
- `atoms/select/table-menu-list.tsx`
- `atoms/split-button/split-button.tsx`

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/atoms/
git commit -m "refactor(atoms): migrate Chakra direct imports to Anker primitives

Replaces @chakra-ui/react imports with Anker primitive imports
for all wrapped components (layout, typography, Badge, Table).
Components without Anker wrappers (Icon, Circle, Square,
Clipboard compound) remain as direct Chakra imports.

Closes #73"
```

---

### Task 2: Migrate components source files

**Files:** 18 files in `src/components/`

- [ ] **Step 1: Migrate each component source file**

For each file listed in the Task 2 table, apply the same import splitting pattern. Key files:

`components/widget.tsx` — migrate Box, Flex, Text; keep Card (Chakra Card, not Anker Card):
```ts
// Before:
import { Box, Card, Flex, Text } from "@chakra-ui/react";

// After:
import { Card } from "@chakra-ui/react";
import { Box, Flex } from "../primitives/layout";
import { Text } from "../primitives/typography";
```

`components/data-table/data-table.tsx` — migrate Box, Flex, Text, Checkbox, Table:
```ts
// Before:
import { Box, Checkbox, Flex, Table, Text } from "@chakra-ui/react";

// After:
import { Box, Flex } from "../../primitives/layout";
import { Checkbox } from "../../primitives/checkbox";
import { Table } from "../../primitives/table";
import { Text } from "../../primitives/typography";
```

`components/modal.tsx` — migrate Flex, Spacer, Separator; keep Dialog, Portal:
```ts
// Before:
import { Dialog, type DialogRootProps, Flex, Portal, Separator, Spacer } from "@chakra-ui/react";

// After:
import { Dialog, type DialogRootProps, Portal } from "@chakra-ui/react";
import { Flex, Spacer } from "../primitives/layout";
import { Separator } from "../primitives/separator";
```

Files to migrate: widget, card, card-list, card-list-data, card-list-item, pagination, modal, drawer, fact-box, upload-drop-zone, chip-picker, inline-creatable-list, bulk-action-bar, sidebar-section, labeled-switch, selectable-card, data-table, stepper.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/
git commit -m "refactor(components): migrate Chakra direct imports to Anker primitives

Replaces @chakra-ui/react imports with Anker primitive imports
for layout, typography, Checkbox, Table, Collapsible, Separator.
Chakra compound components (Dialog, Drawer, Menu, Portal) and
infrastructure (chakra factory, useSlotRecipe) remain as direct imports.

Closes #74"
```

---

### Task 3: Migrate forms source files

**Files:** 6 files in `src/forms/` (4 files have only non-wrapped imports → skip)

- [ ] **Step 1: Migrate each form source file**

Files to migrate:
- `forms/textarea-field.tsx` — Textarea, TextareaProps → primitives/textarea
- `forms/checkbox-field.tsx` — Checkbox → primitives/checkbox; keep Field
- `forms/radio-group-field.tsx` — RadioGroup → primitives/radio, Stack → primitives/layout; keep RadioGroupRootProps
- `forms/form-field.tsx` — HStack → primitives/layout, Text → primitives/typography; keep Field
- `forms/controlled-form-field.tsx` — HStack → primitives/layout; keep Field
- `forms/file-field.tsx` — Box, Flex → primitives/layout, Text → primitives/typography; keep Button

Files to skip (only non-wrapped imports):
- `forms/input-field.tsx` (InputProps type only)
- `forms/select-field.tsx` (NativeSelectFieldProps type only)
- `forms/color-picker-field.tsx` (ButtonProps, IconButton, Square — none wrapped)
- `forms/inline-edit.tsx` (ButtonGroup, Editable, IconButton, useEditableContext — none wrapped)
- `forms/array-field.tsx` — migrate Box, Grid, GridItem, Stack → layout, Text → typography; keep Button, ButtonGroup, IconButton, Input
- `forms/date-picker-field.tsx` (Input — no wrapper)
- `forms/search-input.tsx` (Input, InputGroup — no wrapper)

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/forms/
git commit -m "refactor(forms): migrate Chakra direct imports to Anker primitives

Replaces @chakra-ui/react imports with Anker primitive imports
for layout, typography, Checkbox, Textarea, RadioGroup.
Form-specific Chakra components (Field, Input, InputGroup,
Editable) remain as direct imports.

Closes #75"
```

---

### Task 4: Migrate feedback source files

**Files:** 1 file (confirm-modal.tsx has only non-wrapped imports → skip)

- [ ] **Step 1: Migrate upload-toast-stack.tsx**

```ts
// Before:
import { Box, Flex, HStack, Stack, Text } from "@chakra-ui/react";

// After:
import { Box, Flex, HStack, Stack } from "../primitives/layout";
import { Text } from "../primitives/typography";
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/feedback/
git commit -m "refactor(feedback): migrate Chakra direct imports to Anker primitives

Closes #76"
```

---

### Task 5: Migrate story files

**Files:** ~30 story files across all layers that import layout/typography from Chakra.

- [ ] **Step 1: Migrate all story files**

Apply the same import splitting to all `.stories.tsx` files. The most common pattern is:
```ts
// Before:
import { Box, HStack, Stack, Text } from "@chakra-ui/react";

// After:
import { Box, HStack, Stack } from "../../primitives/layout";  // or ../primitives/layout
import { Text } from "../../primitives/typography";
```

Story files to migrate (grouped by layer):

**Atoms stories** (~15 files):
- `atoms/button/button.stories.tsx` — HStack, Stack
- `atoms/button/icon-button.stories.tsx` — HStack
- `atoms/persona/persona.stories.tsx` — Stack
- `atoms/clipboard/clipboard.stories.tsx` — HStack, Stack, Text
- `atoms/stat/stat.stories.tsx` — HStack
- `atoms/datetime/datetime.stories.tsx` — Stack, Text
- `atoms/text-overflow/text-overflow.stories.tsx` — Box
- `atoms/text-input/text-input.stories.tsx` — Box, Stack
- `atoms/type-badge/type-badge.stories.tsx` — HStack
- `atoms/actions/actions.stories.tsx` — HStack
- `atoms/status-badge/status-badge.stories.tsx` — HStack
- `atoms/checkbox-card/checkbox-card.stories.tsx` — Box, Text
- `atoms/search-input/search-input.stories.tsx` — Box
- `atoms/comment/comment.stories.tsx` — Box
- `atoms/date-input/date-input.stories.tsx` — Box
- `atoms/select/select.stories.tsx` — Box
- `atoms/data-list/data-list.stories.tsx` — Badge
- `atoms/empty-state/empty-state.stories.tsx` — Icon (keep as Chakra)

**Components stories** (~15 files):
- `components/modal.stories.tsx` — Button, Text
- `components/drawer.stories.tsx` — Button, Text
- `components/card.stories.tsx` — Text
- `components/card-list.stories.tsx` — Text
- `components/widget.stories.tsx` — Text
- `components/fact-box.stories.tsx` — Text
- `components/upload-drop-zone.stories.tsx` — Text
- `components/pagination.stories.tsx` — Stack, Text
- `components/stepper/stepper.stories.tsx` — Button, Flex, Text
- `components/data-table/data-table.stories.tsx` — Text
- `components/table-item.stories.tsx` — Text
- `components/table.stories.tsx` — Text
- `components/table-data.stories.tsx` — Flex
- `components/timeline.stories.tsx` — Badge, Text
- `components/tree-view.stories.tsx` — createTreeCollection (keep as Chakra)
- `components/selectable-card/selectable-card.stories.tsx` — Badge, Box, Grid (as ChakraGrid), Text
- `components/labeled-switch.stories.tsx` — Stack
- `components/sidebar-section.stories.tsx` — Badge, Box, Stack, Text
- `components/bulk-action-bar/bulk-action-bar.stories.tsx` — Box

**Primitives stories** (~15 files — these use Chakra for demo purposes):
- `primitives/tooltip.stories.tsx` — Button
- `primitives/toggle-tip.stories.tsx` — Button, Text
- `primitives/alert.stories.tsx` — Button
- `primitives/leave-page-confirmation.stories.tsx` — Button
- `primitives/menu.stories.tsx` — Button
- `primitives/popover.stories.tsx` — Button, Text
- `primitives/toaster.stories.tsx` — Button, Stack
- `primitives/hover-card.stories.tsx` — Box, Link, Stack, Text
- `primitives/color-mode.stories.tsx` — Stack, Text
- `primitives/skeleton.stories.tsx` — HStack, Stack
- `primitives/spinner.stories.tsx` — HStack
- `primitives/progress.stories.tsx` — HStack, Stack
- `primitives/stat.stories.tsx` — Stack
- `primitives/segmented-control.stories.tsx` — Stack
- `primitives/slider.stories.tsx` — Stack
- `primitives/switch.stories.tsx` — Stack
- `primitives/radio.stories.tsx` — Stack
- `primitives/native-select.stories.tsx` — Stack
- `primitives/pin-input.stories.tsx` — Stack

**Forms stories:**
- `forms/checkbox-field.stories.tsx` — Stack
- `forms/controlled-form-field.stories.tsx` — Input (keep as Chakra)
- `forms/form-field.stories.tsx` — Input (keep as Chakra)
- `forms/dirty-form-guard.stories.tsx` — Box, Text

**Feedback stories:**
- `feedback/confirm-modal.stories.tsx` — Button, Text

**Showcase stories** (already use Chakra for layout — migrate to Anker):
- `stories/showcase/settings-page.stories.tsx`
- `stories/showcase/entity-detail.stories.tsx`
- `stories/showcase/data-management.stories.tsx`
- `stories/showcase/dashboard.stories.tsx`
- `stories/showcase/dark-mode-comparison.stories.tsx`

Note: For primitives stories, `Button` imports should use the Anker `Button` atom, not `@chakra-ui/react` Button. Layout imports should use sibling primitives (e.g., `./layout`).

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Run build:storybook**

Run: `npm run build:storybook`
Expected: BUILD SUCCESS (with only `"use client"` warnings)

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "refactor(stories): migrate Chakra direct imports to Anker primitives

Replaces @chakra-ui/react imports in all story files with
Anker primitive/atom imports for layout, typography, Badge,
and Button components.

Closes #77"
```

---

### Task 6: Final verification

- [ ] **Step 1: Verify no remaining violations**

Search for any remaining `@chakra-ui/react` imports in atoms/components/forms/feedback that import wrapped components:

```bash
# Should return 0 results for wrapped components
grep -rn 'from "@chakra-ui/react"' src/atoms/ src/components/ src/forms/ src/feedback/ | grep -E '\b(Box|Flex|Grid|GridItem|HStack|VStack|Stack|Spacer|Center|Container|Text|Heading|Code|Link|Badge|Checkbox|Collapsible|Separator|Table|Textarea|RadioGroup)\b'
```

Remaining `@chakra-ui/react` imports should ONLY be: wrapper files (button.tsx, icon-button.tsx, etc.), non-wrapped components (Dialog, Drawer, Field, Input, Icon, etc.), and infrastructure (chakra, types, hooks).

- [ ] **Step 2: Run full check suite**

```bash
npm run typecheck && npm run lint && npm run build:storybook
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: verify Chakra import migration complete

Closes #78"
```
