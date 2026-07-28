# anker

The shared UI component library (`@knkcs/anker`) for the knk software group: design tokens, primitives, atoms, composites, form controls, page templates, and a dashboard framework consumed by all knkCMS microservices.

## Language

### Architecture

**Layer**:
One of the package's nine subpath exports: `theme`, `primitives`, `atoms`, `components`, `forms`, `feedback`, `dashboard`, `templates`, `navigation`. Every component has exactly one layer as its canonical home; any other layer may only re-export it.
_Avoid_: module, section

**Primitive**:
A wrapper around exactly one Chakra UI component that preserves Chakra's API shape while applying anker defaults.
_Avoid_: wrapper, base component

**Atom**:
An anker-original small UI unit that composes primitives and owns its own API — it has no single Chakra counterpart.

### Dashboard

**Widget**:
A building block of a Dashboard, described by a Widget Definition and placed as a Widget Instance. The word belongs to the dashboard layer.
_Avoid_: "Widget" for the presentational heading-and-icon card in the components layer (legacy naming)

**Widget Definition**:
The registered contract for a widget type: identity, sizing bounds, settings schema, and renderer.

**Widget Instance**:
A saved placement of a widget on a dashboard — which definition, its layout position, and its settings.

### Form state

**Dirty**:
The technical state of a field or form whose current value differs from its last saved value. This is the term used inside the forms layer.
_Avoid_: modified, changed, touched ("touched" means focused-then-blurred in RHF, not modified)

**Unsaved changes**:
The user-facing framing of dirty state, used by navigation guards when warning before leaving a dirty surface. Dirty is the state; unsaved changes is how the UI talks about it.
