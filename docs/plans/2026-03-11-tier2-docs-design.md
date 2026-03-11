# Tier 2 Docs & Missing Stories Design

## Goal

Fill Storybook coverage gaps: add missing Skeleton stories, and MDX documentation for Tier 2 components (Select, Accordion, Breadcrumb).

## Scope

### 1. Skeleton Stories (`src/primitives/skeleton.stories.tsx`)

One `Default` story showing all three Skeleton variants (Skeleton, SkeletonText, SkeletonCircle) together.

### 2. Select MDX (`src/atoms/select/select.mdx`)

Combined page covering BaseSelect, CreatableSelect, and multi-select. Sections:
- Description — what Select is, when to use each variant
- Usage — `<Canvas of={Stories.Default} />`
- Multi-select — `<Canvas of={Stories.Multi} />`
- Guidelines — do's and don'ts (portal target, loading state, BaseOption shape)
- Accessibility — keyboard navigation, ARIA attributes from chakra-react-select
- Props — `<ArgTypes of={Stories} />`

No Gaps & Migration section.

### 3. Accordion MDX (`src/primitives/accordion.mdx`)

Lighter doc. Sections:
- Description — simplified accordion API
- Usage — `<Canvas of={Stories.Default} />`
- Multiple — `<Canvas of={Stories.Multiple} />`
- Guidelines — do's and don'ts
- Accessibility — keyboard nav, ARIA attributes
- Props — `<ArgTypes of={Stories} />`

No Gaps & Migration section.

### 4. Breadcrumb MDX (`src/primitives/breadcrumb.mdx`)

Lighter doc. Sections:
- Description — navigation breadcrumbs
- Usage — `<Canvas of={Stories.Default} />`
- Custom Separator — `<Canvas of={Stories.WithSeparator} />`
- Guidelines — do's and don'ts
- Accessibility — nav landmark, aria-current
- Props — `<ArgTypes of={Stories} />`

No Gaps & Migration section.

## Key Decisions

- Lighter MDX structure for Accordion/Breadcrumb (no Gaps & Migration) — they're thin Chakra wrappers
- Select gets fuller treatment due to complexity (multiple variants, TableMenuList, custom option rendering)
- Skeleton just needs a Default story — it's a simple visual primitive
