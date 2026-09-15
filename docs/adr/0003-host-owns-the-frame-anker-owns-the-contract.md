# The host owns the page frame; anker owns the contract it is reported through

anker's page templates used to *draw* the page header: `DetailPageTemplate`,
`IndexPageTemplate` and `SettingsPageTemplate` built a `<PageHeader>` element
and pushed it into `<AppShell>`'s opaque header slot. That works exactly as
long as the screen is mounted under an anker `AppShell`, and it is documented
to do nothing anywhere else. The consumers this library exists for are no
longer only shells of their own: template-ui, taskhub-ui and layout-ui are
*packages* whose screens core mounts inside a page frame core draws itself,
with its own header component, in its own Chakra system. Under that host a
taskhub task detail rendered with no title, no Save and no breadcrumb, and
core's workaround — a nested, scoped `AppShell` around every embedded screen —
produced a double heading and a second visual language on one page. knkcms/core
ADR 0003 ("One way to integrate a service") decided the shape that fixes this
and named anker as its home; this ADR records anker's half of it.

**The host owns the page frame. anker owns the contract.** A screen no longer
writes header *markup* into a slot; it reports header *state* — title,
subtitle, eyebrow, breadcrumbs, avatar, badges, meta, tabs, actions — through
`usePageFrame` from `@knkcs/anker/host`, and whoever mounted `<HostProvider>`
renders that state in the frame it owns. anker's own `AppShell` is the first
host: it mounts the provider and renders a `<PageHeader>` from the reported
frame, so under a standalone shell nothing looks different and the contract
has one consumer proving it before core does. The same contract carries
`HostIdentity` — the viewer's user id, the workspace id, a members accessor —
in the other direction: provided once at the host's root, read by every
screen through `useHostIdentity`, instead of arriving as props on every mount
and being typed differently by every package.

## Why state, not a node

The header slot already existed and worked; the temptation was to make it
work without an `AppShell`. But a node is opaque: a host that receives
`<PageHeader title=… />` can only place it, not render the title in its own
header, put the breadcrumbs in its own breadcrumb bar, or move the actions to
where its design keeps them. State is what a host can *own*. The frame
mirrors `PageHeaderProps` one-to-one (pinned by `page-frame.mirror.test.ts`)
so anker's own consumer is a spread, and its fields are the vocabulary a
foreign host reads.

The one exception is deliberate: `actions`, `avatar`, `badges`, `meta` and
`tabs` stay `ReactNode`. A Save button's behaviour belongs to the screen that
knows what saving means; a config object for actions would force every
variant to be expressible as data, and this library has been wrong before
about having that crystal ball (page-patterns §12: slots accept ReactNode,
not config objects). The host decides *where* an action goes, never *what*
it is.

## Why the contract is not AppShell

`AppShell` is a layout: sidebar, main, rail, a grid of `100vh`. A host like
core has its own layout and must not be asked to mount anker's to get a
title out of a screen. So the contract lives in its own subpath, `host`,
that imports nothing from the templates layer; `templates` depends on `host`,
not the other way round. `AppShell` is a consumer of the contract, not its
owner — the day core adopts anker's design system its header can become
`<PageHeader>` and nothing about the contract changes.

## Consequences

- **No-op without a provider, by contract.** `usePageFrame` does nothing and
  `useHostIdentity` returns `emptyHostIdentity` (empty ids, an empty members
  list) outside any provider. Stories and isolated component tests keep
  working, and a screen never null-checks identity — it compares against
  `userId` and gets no match.
- **The opaque slots stay.** `usePageHeader`, `usePageActions` and
  `usePageRail` remain for bespoke chrome and rails. When both a header node
  and a frame are present under `AppShell`, the node wins: registering
  markup is the explicit override. A template still resolves `actions` from
  the actions slot when given none — under `AppShell`. That slot is
  `AppShell`'s, not the contract's: under a foreign host a tab body's
  `usePageActions` reaches nothing, and a screen that needs its actions
  everywhere passes them to the template.
- **A nested provider inherits identity.** `AppShell` mounts a provider with
  no identity of its own so that a `<HostProvider identity=…>` above the
  shell is not shadowed — core's bridge shell keeps working during the
  migration — and a package's standalone shell provides identity by wrapping
  its `AppShell`. Frames, by contrast, are captured by the nearest provider:
  the shell that draws the header is the one that gets the state.
- **`sticky` rides along as a hint.** The templates' `stickyHeader` prop has
  to travel somewhere; it is a presentation preference `AppShell` honours and
  a host may ignore, and it is the only field the frame has that
  `PageHeaderProps` does not.
- **Reports are value-compared.** A screen re-rendering for body state with
  an unchanged frame does not re-notify the host; a frame carrying a fresh
  element does, because a node is opaque and must be re-rendered. A host
  keeps the state it feeds in a component that receives the screens as
  `children` — the shape `TestHost` and `AppShell` both use — so storing a
  frame never re-creates the screen tree.
- **Members are synchronous.** `HostMembers` is `list()` and `byId(userId)`
  over data the host already fetched; the host owns loading, caching and
  refetching. The line ADR 0002 draws — the connection is the consumer's —
  holds here too.
- **A test host is part of the contract.** A package proves what its screen
  reports by rendering it under `TestHost` and reading the handle; the
  alternative, every package writing its own capture provider, is the
  situation with fake clients this spec is also cleaning up.
