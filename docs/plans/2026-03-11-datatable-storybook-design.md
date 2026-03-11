# DataTable Storybook Design

## Goal

Add Storybook stories and MDX documentation for the DataTable component, covering all key features with interactive examples.

## Approach: Stories + MDX Doc

### 1. Stories (`src/components/data-table/data-table.stories.tsx`)

7 stories with shared sample data (users with name, email, role, status):

1. **Default** — basic table with 3 columns, no interactivity
2. **Sorting** — columns with `enableSorting`, controlled sorting state
3. **Selection** — `selectable` with controlled row selection state
4. **Loading** — `loading={true}` showing skeleton rows
5. **Empty** — empty data array with custom `emptyState`
6. **Paginated** — 25 rows, `pageSize=5`, controlled page state
7. **CustomCells** — columns using custom `cell` renderers (status badge, formatted date)

### 2. MDX Doc (`src/components/data-table/data-table.mdx`)

Following the established MDX structure (Modal, CardList, Drawer):

- **Description** — what DataTable is, when to use vs CardList
- **Usage** — `<Canvas of={Stories.Default} />`
- **Guidelines** — do's and don'ts for DataTable vs CardList, sorting patterns
- **Accessibility** — `aria-sort` on columns, checkbox labels, skeleton `aria-hidden`
- **Gaps & Migration** — column filtering (not yet), column resizing (not yet), virtualization (not yet), row expansion (not yet), server-side sorting docs (gap)
- **Props** — `<ArgTypes of={Stories} />`

## Key Decisions

- Co-located files next to the component source (inside `src/components/data-table/`)
- Shared sample data across stories to keep things DRY
- Variants (striped/hoverable) and row click covered by autodocs controls, no dedicated stories
- Custom cells story demonstrates real-world column definitions with renderers
