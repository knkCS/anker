# One Save in the page header; the entity's actions in the rail

page-patterns gave a detail or settings page two places to save from. A Save
in each card's footer "when the form is one of several independent sections",
a Save in the `PageHeader` when the form is the whole page, never both. In
practice the line between the two cases was the author's guess, and
neighbouring screens guessed differently: taskhub-ui's `task-type-detail`
saves from a card footer, its `group-detail` and `calendar-detail` from the
header. A user moving between them learns two models of what "saved" means.
blueprinthub's harness (knkCS/blueprinthub#153) made the cost concrete: a
blueprint's tabs are one entity, and saving it per card would write one
Revision per tab for what the user thinks of as one change.

The rail had the opposite problem — one surface, two rules. §4 listed
"stuffing primary actions in the rail" as an anti-pattern and told form pages
to hide the rail, while §10 held up taskhub's detail pages, whose
`ContextRail` carries their quick actions (Make default, Delete), as the
evidence the index/detail rule rests on.

This ADR replaces both with one rule each.

## Decision

**The `PageHeader` Save is the one Save on a detail or settings page.** A card
footer never saves.

- A page with several tabs keeps a **draft per tab**, and the header Save
  persists every changed tab at once — in blueprinthub, one Revision, not one
  per tab.
- The Save shows that there are unsaved changes (it says how many tabs
  changed, and is disabled when none did), and leaving with drafts asks first.
- Settings that genuinely save on their own get a **tab of their own**, with
  the same header Save — not a second Save on a shared tab.

**The header holds the page's one primary action; what you do *to* the
entity goes in the rail.**

- The header's `actions` carry the page's one primary action — Save on an
  edit page.
- Verbs that act on the entity as a whole — cut a release, duplicate,
  archive, delete, make default — go in the rail's **Actions** section. An
  **About** section may show at-a-glance facts (created, owner, status).
- The rail never holds Save.
- A detail page whose tabs are forms **keeps** its quick-actions rail. It is
  collapsible and persists that with `storageKey`.

## Why one Save

Two Saves on one page ask the user which one persists what; the old rule
avoided that only by forbidding both on the same screen, and still left
every *other* screen free to pick a different one. A single, fixed place
means the user never looks for it. Per-tab drafts follow from it: if Save
covers every tab, moving between tabs cannot throw work away, so each tab's
draft must outlive the tab's mount. With nav-link tabs only the active panel
is mounted (§12.2), so a draft held in the tab's own form state dies on
every switch — drafts live above the router outlet, at the page's layout
level, next to the `TabDirtyProvider` that tracks which tabs are dirty.

A card-footer Save made one more thing true that is now false: that a
section could be saved without the rest of the page. Where that independence
is real it is worth a tab, which is a URL, a dirty dot and a clear scope for
the header Save; where it is not, it was an artefact of the layout.

## Why actions in the rail

"No primary actions in the rail" was right about the *primary* action and
wrong to generalise. A page has one primary action, and it is the header's.
The things you do *to* an entity are not that action: they are rarer, often
destructive, and they don't change with the tab you are on. The rail is the
surface that is constant across tabs and already holds the entity's
at-a-glance facts, so its verbs sit next to its facts. Hiding the rail on
form pages would leave those verbs with nowhere to go but the header —
crowding the one primary action this rule protects — or a `…` menu with no
room to explain itself.

## Consequences

- **No new template or `PageFrame` field.** The header Save is an ordinary
  `actions` node. It closes over the dirty state rather than reading it from
  context, because a reported node renders outside the screen's providers
  (ADR 0003): mount `TabDirtyProvider` *above* the component that renders
  the template, read `useTabDirty()` there, and build the Save from it.
  `TabDirtyState` gains `dirtyTabs` — the dirty keys in the order they
  became dirty — so that Save can say "2 tabs changed" and hand the list to
  the handler that persists them. The same list (`dirtyTabs.length > 0`)
  feeds `UnsavedChangesGuard` with a `safePathPrefix` covering the sibling
  tabs. A frame carrying a fresh `actions` element re-notifies the host
  (ADR 0003), so the count stays current with no extra wiring.
- **An explicit Save hides `usePageActions`.** A template resolves
  `actions ?? registered`, so once a page passes its Save as `actions`, a
  tab's `usePageActions(<Add/>)` reaches nothing. That is the rule working —
  the header holds one primary action — and the tab's add moves into its own
  toolbar (page-patterns §12.1 "Index-in-Tab"). A page with no Save keeps
  the old lift.
- **A drawer applies, the header saves.** A drawer that edits a nested child
  (page-patterns §10) writes into the tab's draft and closes; it does not
  persist. A modal is its own scope and keeps its own Save.
- **A tab does not clear its dirty mark on unmount.** The Dirty-surfaces
  guide used to clear it in the effect cleanup; with drafts that outlive the
  tab, clearing it would hide unsaved work from the header and the guard.
  The mark clears when the draft is saved or discarded, and the registry is
  keyed to the entity (`<TabDirtyProvider key={id}>`) so a route change to
  another record starts clean.
- **Rail actions that open a dialog keep the dialog in the screen.** The
  rail, like `actions`, renders outside the screen's providers, so a rail
  button that rendered its own dialog would lose the form, query and router
  contexts the dialog needs (knkCS/anker#212). Until a portal-based host
  rendering exists, the rail button sets state the screen owns and the
  screen renders the dialog. #212 is on this rule's path; it does not block
  adopting it.
- **page-patterns changes in three places.** §4 drops "hide the rail on form
  pages" and the primary-actions anti-pattern in favour of the Actions/About
  rule; §10's Save-button placement collapses to the header rule; §10's
  index/detail evidence no longer cites a card-footer Save as acceptable.
- **Existing screens are out of compliance, not broken.** taskhub-ui's
  `task-type-detail` card-footer Save keeps working; it is migrated on its
  own schedule.
