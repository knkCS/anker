# An atom may own async orchestration, provided it never fetches

anker components do not fetch. That rule has always meant two different things
at once, and only one of them is load-bearing:

1. **anker opens no connections.** No transport, no endpoint, no auth, no HTTP
   client in `package.json`. The library is domain-free, and a library that
   knows a URL is coupled to whoever serves it.
2. **anker holds no asynchrony.** Anything with a `Promise` in it belongs to
   the consumer.

The first is the charter. The second was never stated, only inferred — and
`LookupSelect` (#200) makes the difference explicit: it owns query state,
debouncing, menu-open gating, request cancellation, stale-answer guarding, page
accumulation, loading and failure presentation, and the resolution of a stored
id into a readable label. All of that is asynchronous. None of it is fetching.
It calls two functions the consumer supplies and cannot tell a network call
from an array literal.

**The line is the connection, not the `Promise`.** An atom may hold async
orchestration when every request that leaves it is a call to a
consumer-supplied function.

## Why the orchestration cannot live with the consumer

It already has, three times, in three shapes — a hand-rolled version in the form
library, one in the layout package on a raw HTML `<select>`, one in core that
fetched an entire table and filtered in the browser. They looked different and
behaved differently, which is the visible symptom. The invisible one matters
more: debounce, cancellation and stale-answer guarding are where a control is
subtly wrong rather than obviously broken. A late answer for an abandoned query
overwriting the current one is a bug nobody files, because it looks like a slow
network.

That is not consumer-specific behaviour. It is the same in every consumer, and
a library that hands each of them the parts to assemble is not saving them from
anything.

## The precedent this extends

The rule was already narrower than "no asynchrony", in two places:

- **`SearchInput`** owns a debounce and emits `onSearch(query)` after it. The
  timer is anker's; the search is not.
- **`VirtualizedMessageList`** owns scroll thresholds and edge-triggered
  arming, and emits `onLoadOlder`. The scroll maths is anker's; the page is
  not.

`LookupSelect` is the same shape with a longer callback list — and, newly, with
a return value it waits on. That is the only genuinely new thing here.

## Consequences

- **The consumer's function is the whole data layer.** `search` is required;
  `resolve` is optional and its absence degrades visibly (a stored id displays
  as itself) rather than silently.
- **Cancellation is offered, never relied on.** The `AbortSignal` an atom hands
  a Source is a courtesy the Source may decline. Correctness comes from
  discarding answers that are no longer current, which works whether or not
  anyone honours the signal. An atom that only aborts has a race; an atom that
  only guards leaks requests. Do both.
- **The charter needs a test, not a convention.** "Never fetches" is now a
  claim about a file that a person could break in one line, so
  `lookup-select.never-fetches.test.ts` pins it: no transport, no endpoint or
  credential, no foreign import, no HTTP client in `package.json`. A new
  async-orchestrating atom should bring one.
- **Async orchestration is not a licence for domain knowledge.** The atom knows
  a query, a cursor and a signal. It does not know what is being looked up,
  what an id means, or who is allowed to see it.
- **This does not open the door to state management.** The orchestration here
  is scoped to one control's own interaction and dies with it. Caching across
  components, shared stores and request deduplication are the consumer's, and
  an atom that grows them has acquired a backend by another name.
