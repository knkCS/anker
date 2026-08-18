# Atoms expose an explicit subset of Button props, not all of them

An atom that composes `Button` must declare the Button props it actually
forwards — `Pick<ButtonProps, "variant" | "size" | …>` — rather than
`extends ButtonProps`. A type that promises props the component silently
discards is worse than one that offers fewer: `SplitButton` declared
`extends ButtonProps` and then overwrote `colorPalette` and `size` with
hard-coded values, so `<SplitButton size="sm" colorPalette="gray" />`
type-checked and did nothing, with no warning and no way for a consumer to
discover the problem short of reading the source (#192).

## Consequences

- Prop discards become type errors at the call site instead of silent no-ops.
- Structural props a composite owns — the seam radii joining a split button's
  halves, `asChild` on an element a menu trigger needs, `children` on a
  component that renders its own — are unreachable by construction rather than
  by convention.
- Consumers lose the escape hatch of passing arbitrary style props through an
  atom. That is the intended trade: an atom that accepts arbitrary layout props
  is an atom whose appearance cannot be guaranteed, and per-call-site overrides
  are how visual rhythm drifts. Consumers needing more should compose `Button`
  and the primitives directly, or ask for the prop to be added to the `Pick`.
- Adding a prop to the `Pick` later is additive; removing one is breaking. The
  list should start small.

`MenuButton` was already written this way; `SplitButton` was brought in line in
5.0.0. Existing atoms predating this are not yet audited.
