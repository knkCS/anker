# Component Documentation Design

## Goal

Enhance anker's Storybook from a component showcase into proper documentation for internal devs and new team members.

## Approach: Hybrid Autodocs + Targeted MDX

### 1. Autodocs Baseline

Enable Storybook's `autodocs` globally so every component auto-generates a docs page from TypeScript types and stories. Enrich existing props interfaces with JSDoc comments where missing.

### 2. MDX Docs (co-located, ~7-10 components)

Components with migration notes, non-obvious guidelines, or known gaps get a hand-crafted MDX file next to their source.

**MDX structure:**
- Description — what and when to use
- Usage — embedded live stories via `<Canvas>`
- Guidelines — do's and don'ts
- Accessibility — ARIA attributes, keyboard behavior
- Gaps & Migration — table of feature gaps vs. old Core, migration notes
- Props — auto-generated via `<ArgTypes>`

**Tier 1 (priority):**
CardList, DataTable, Modal, Drawer, Stepper, Pagination, ArrayField, CodeField, FileField, ConfirmModal

**Tier 2 (follow-up):**
Popover, HoverCard, Tooltip, TreeView, Select, Accordion, Breadcrumb

**Tier 3 (autodocs sufficient):**
Alert, Avatar, Spinner, Skeleton, Switch, Radio, Checkbox, Progress, Slider, PinInput, SegmentedControl, StatusBadge, TypeBadge, Persona, DateTime, Clipboard, DataList, Timeline

### 3. Introduction Page

`src/introduction.mdx` as Storybook landing page covering: what anker is, installation, 6-layer architecture, links to key components.

### 4. Sidebar Organization

Explicit sort order by layer via Storybook config: Introduction > Primitives > Components > Atoms > Forms > Feedback.

## Audience

Both internal knk developers consuming anker in microservices, and new team members onboarding.

## Key Decisions

- Co-located MDX files (next to component source and stories)
- Autodocs for baseline coverage, MDX only where it adds value
- `<Canvas>` and `<ArgTypes>` blocks to avoid duplicating code/props
- Gaps & Migration section covers both feature gaps and Core monolith differences
