import { describe, expect, it } from "vitest";
import { buildMessageListRows } from "./build-rows";

interface Msg {
	id: string;
	sentAt: Date;
	body: string;
}

const msg = (id: string, iso: string): Msg => ({
	id,
	sentAt: new Date(iso),
	body: `body-${id}`,
});

const getItemKey = (m: Msg) => m.id;

describe("buildMessageListRows", () => {
	it("returns message rows in item order with prefixed keys when no date accessor is given", () => {
		const items = [
			msg("a", "2026-07-27T09:00:00"),
			msg("b", "2026-07-28T10:00:00"),
		];
		const rows = buildMessageListRows(items, { getItemKey });
		expect(rows).toEqual([
			{ kind: "message", key: "m:a", item: items[0], index: 0 },
			{ kind: "message", key: "m:b", item: items[1], index: 1 },
		]);
	});

	it("inserts a divider before the first message and at each local-day change", () => {
		const items = [
			msg("a", "2026-07-27T09:00:00"),
			msg("b", "2026-07-27T23:59:00"),
			msg("c", "2026-07-28T00:01:00"),
			msg("d", "2026-07-28T14:00:00"),
		];
		const rows = buildMessageListRows(items, {
			getItemKey,
			getItemDate: (m) => m.sentAt,
		});
		expect(rows.map((r) => r.key)).toEqual([
			"d:2026-07-27",
			"m:a",
			"m:b",
			"d:2026-07-28",
			"m:c",
			"m:d",
		]);
		const firstDivider = rows[0];
		expect(firstDivider.kind).toBe("divider");
		if (firstDivider.kind === "divider") {
			// Divider carries the first message's date of that day for labeling.
			expect(firstDivider.date).toEqual(items[0].sentAt);
		}
	});

	it("keeps divider keys unique when the same day recurs non-consecutively", () => {
		// Consumer owns ordering; a non-chronological list must still produce
		// unique virtualizer keys.
		const items = [
			msg("a", "2026-07-27T09:00:00"),
			msg("b", "2026-07-28T09:00:00"),
			msg("c", "2026-07-27T18:00:00"),
		];
		const rows = buildMessageListRows(items, {
			getItemKey,
			getItemDate: (m) => m.sentAt,
		});
		const keys = rows.map((r) => r.key);
		expect(new Set(keys).size).toBe(keys.length);
		expect(rows.filter((r) => r.kind === "divider")).toHaveLength(3);
	});

	it("treats an invalid date as dateless: no divider, day run unchanged", () => {
		const items = [
			msg("a", "2026-07-27T09:00:00"),
			msg("bad", "not-a-date"),
			msg("b", "2026-07-27T10:00:00"),
		];
		const rows = buildMessageListRows(items, {
			getItemKey,
			getItemDate: (m) => m.sentAt,
		});
		expect(rows.map((r) => r.key)).toEqual([
			"d:2026-07-27",
			"m:a",
			"m:bad",
			"m:b",
		]);
	});

	it("returns an empty list for no items", () => {
		expect(
			buildMessageListRows([], {
				getItemKey,
				getItemDate: (m: Msg) => m.sentAt,
			}),
		).toEqual([]);
	});
});
