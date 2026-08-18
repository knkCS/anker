# Atoms expose an explicit subset of Button props, not all of them

An atom that composes `Button` and does **not** forward every Button prop must
declare the ones it actually forwards — `Pick<ButtonProps, "variant" | "size" | …>`
— rather than `extends ButtonProps`. A type that promises props the component
silently discards is worse than one that offers fewer: `SplitButton` declared
`extends ButtonProps` and then overwrote `colorPalette` and `size` with
hard-coded values, so `<SplitButton size="sm" colorPalette="gray" />`
type-checked and did nothing, with no warning and no way for a consumer to
discover the problem short of reading the source (#192).

`extends ButtonProps` stays legal where the component genuinely forwards
everything. `CommentAction` sets its defaults *before* `{...props}`, so a
consumer's values win and nothing is discarded — its type is an honest
description of what it does, and narrowing it would cost flexibility for no
gain in honesty (#194).

## The general rule this serves

**Declare a prop and you must honour it** — by forwarding it, by merging it, or
by not declaring it at all. The `Pick` is one application of that; it is not the
whole of it.

The audit behind #194 found the same failure in a second costume: nine slots
across `Stepper` and `ColorModeButton` declared `css` and then either dropped
the consumer's value (applied `css` after `{...rest}`) or replaced their own
recipe styling with it (applied `css` before). Both are the #192 defect, and
neither would have been caught by a rule about `Pick`ing Button props. The fix
there is merging — `css={[styles.slot, props.css]}` — not narrowing, because
`css` is a prop these components should accept.

Note the ordering trap that makes this class hard to see: a value set *before*
`{...spread}` is clobbered by an explicit `undefined` in the spread, so
`<Stepper css={undefined} />` wiped the slot styling entirely. Absent and
`undefined` are not the same thing.

## Consequences

- Prop discards become type errors at the call site instead of silent no-ops.
- Structural props a composite owns — the seam radii joining a split button's
  halves, `asChild` on an element a menu trigger needs, `children` on a
  component that renders its own — are unreachable by construction rather than
  by convention.
- Where an atom does narrow, consumers lose the escape hatch of passing
  arbitrary style props through it. That is the intended trade: an atom that
  accepts arbitrary layout props is an atom whose appearance cannot be
  guaranteed, and per-call-site overrides are how visual rhythm drifts.
  Consumers needing more should compose `Button` and the primitives directly,
  or ask for the prop to be added to the `Pick`.
- Adding a prop to the `Pick` later is additive; removing one is breaking. The
  list should start small.
- The rule needs judgement at each site rather than applying mechanically. That
  is deliberate: the harm being prevented is the silent discard, not the use of
  `extends`.

`MenuButton` was already written this way; `SplitButton` was brought in line in
5.0.0. The atoms were audited against this in #194 — `CommentAction` was the
only other candidate and needed no change.
