# anker

The shared UI component library (`@knkcs/anker`) for the knk software group: design tokens, primitives, atoms, composites, form controls, page templates, and a dashboard framework consumed by all knkCMS microservices.

## Language

### Architecture

**Layer**:
One of the package's ten subpath exports: `theme`, `primitives`, `atoms`, `components`, `forms`, `feedback`, `dashboard`, `templates`, `navigation`, `host`. Every component has exactly one layer as its canonical home; any other layer may only re-export it.
_Avoid_: module, section

**Primitive**:
A wrapper around exactly one Chakra UI component that preserves Chakra's API shape while applying anker defaults.
_Avoid_: wrapper, base component

**Atom**:
An anker-original small UI unit that composes primitives and owns its own API — it has no single Chakra counterpart.

### Host contract

**Host**:
Whoever draws the page frame a screen sits in and provides identity to it — anker's own `AppShell`, or a consuming application such as core with a frame of its own. A host mounts the host contract once.
_Avoid_: shell (for a host that is not `AppShell`), container

**Host contract**:
The `host` layer's agreement between a host and the screens under it: screens report a Page Frame and a Side Rail, the host provides a Host Identity. Owned by anker so every host and every package speaks one vocabulary; anker's `AppShell` is a consumer of it, not its owner.
_Avoid_: slot store, AppShell context

**Page frame**:
The structured header state a screen reports — title, subtitle, eyebrow, breadcrumbs, avatar, badges, meta, tabs, actions, a sticky hint — mirroring the page header's props. State, never markup: the host decides where each field is drawn; the screen decides what an action is (actions stay nodes).
_Avoid_: header node, page header (that is the component that renders one)

**Side rail**:
The node a screen reports through `usePageRail` for the host's side column — status tiles, activity, secondary actions. Travels on its own channel of the host contract, not inside the Page Frame; the host decides where rails go (`AppShell`: its rail column). Like the frame's nodes, it is drawn outside the screen's own providers.
_Avoid_: rail slot (for the contract channel; the slot is `AppShell`'s internal store)

**Host identity**:
Who is looking: the viewer's user id, the workspace id and a synchronous members accessor, provided once by the host and read by screens through the host contract. Has an empty default outside any provider, never null.
_Avoid_: current user props, session

**Screen**:
A page-level component a package exports for a host to mount — body content plus a reported Page Frame, no routes of its own.
_Avoid_: page (ambiguous with the host's route), view

### Data-backed controls

**Source**:
The consumer-supplied async function a control calls to get its options — one query and one cursor in, one page out. The control owns the asking (debounce, gating, cancellation, paging); the Source owns the answering, and is the only thing in the arrangement that knows a transport. A control never has a Source of its own, and a Source is never a URL as far as the control is concerned.
_Avoid_: fetcher, data source, provider, endpoint

**Resolver**:
The consumer-supplied async function that turns stored ids back into readable items, so a control mounted holding an id can show a label. Distinct from the Source: it answers "what is this one?", not "what matches this query?", and it runs on mount rather than on open.
_Avoid_: hydrator, lookup, label fetcher

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

### Actions

**Split button**:
A paired control: one half runs the default action, the other opens a menu of alternatives to it. Both halves are always present — a control offering only a menu is a Menu button, and one offering only an action is a button.
_Avoid_: dropdown button, select action

**Menu button**:
A single button face that opens a menu of actions, collapsing to a plain button when there is only one. It has no default action — nothing happens until the user picks from the menu.
_Avoid_: split button
