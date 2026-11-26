# Follow the anker rules for labels and table cells

As an agent or a person writing a screen on anker, I want anker's agent rules to say how things are named and how long values are shown in tables, so that I do not repeat the mistakes the rules forbid.

## Context

`CLAUDE-ANKER.md` ships with `@knkcs/anker` to npm and holds the agent rules. A consuming repository imports it into its own `CLAUDE.md`. It states which names a screen may show a thing by, and how a DataTable cell renders its value. The DataTable cell rules sit under "DataTable cells"; the id rule is listed under the rules of what not to do.

## Acceptance Criteria

1. `CLAUDE-ANKER.md` states that an id (a KSUID, a UUID or any other generated key) never labels a thing in the UI, in text, a table cell, a link, a title, a breadcrumb or a message, and that a name, a code or a reference is shown instead; and that an id may appear only as a technical detail in a field labelled with its name.
2. `CLAUDE-ANKER.md` states that a DataTable cell renders its value through one of anker's cells, and a long text value through TruncatedTextCell or TextCell, never through raw text.

## Evidence

Checked at commit `058462e7346cb1a9a3d9cf1d24d5b9f901d3f373` by reading `CLAUDE-ANKER.md`.

- AC1: line 90, "**Never label a thing with an id.** An id (a KSUID, a UUID or any other generated key) never labels a thing in the UI: not in text, a table cell, a link, a title, a breadcrumb or a message. Show a name, a code or a reference instead … An id may appear only as a technical detail, in a field labelled with its name (for example "Session ID", in a Code block)."
- AC2: line 310, under "DataTable cells": "**Rule:** a DataTable cell renders its value through one of anker's cells; a long text value through TruncatedTextCell (without `maxLength` it is the plain text cell), never through raw text." anker has no separate `TextCell`; the rule names its plain text cell this way.

## Shaped by

- knkCS/agent-control-plane#887: created
