import { describe, expect, it } from "vitest";
import { partitionReactions } from "./partition-reactions";

describe("partitionReactions", () => {
	it("keeps every reaction when the list fits under the cap", () => {
		const partition = partitionReactions(
			[
				{ emoji: "👍", count: 3 },
				{ emoji: "🎉", count: 1 },
			],
			8,
		);

		expect(partition.visible.map((r) => r.emoji)).toEqual(["👍", "🎉"]);
		expect(partition.hiddenCount).toBe(0);
	});

	it("drops reactions nobody actually made, so they never reach the overflow count either", () => {
		const partition = partitionReactions(
			[
				{ emoji: "👍", count: 3 },
				{ emoji: "🎉", count: 0 },
				{ emoji: "😂", count: -2 },
				{ emoji: "🔥", count: Number.NaN },
				{ emoji: "🚀", count: Number.POSITIVE_INFINITY },
			],
			8,
		);

		expect(partition.visible.map((r) => r.emoji)).toEqual(["👍"]);
		// The dropped four are gone, not hidden — a "+4" the consumer could
		// never reveal would be a lie.
		expect(partition.hiddenCount).toBe(0);
	});

	it("merges a repeated emoji into one chip, holding its first position", () => {
		const partition = partitionReactions(
			[
				{ emoji: "👍", count: 2 },
				{ emoji: "🎉", count: 1 },
				{ emoji: "👍", count: 3, reactedByMe: true },
			],
			8,
		);

		expect(partition.visible).toEqual([
			{ emoji: "👍", count: 5, reactedByMe: true, label: undefined },
			{ emoji: "🎉", count: 1, reactedByMe: false, label: undefined },
		]);
	});

	it("falls back to showing everything when the cap is not a number", () => {
		// NaN survives both Math.floor and Math.max, and a NaN cap slices to
		// nothing while reporting NaN hidden — a row that renders neither the
		// chips nor an honest overflow count.
		const partition = partitionReactions(
			[
				{ emoji: "👍", count: 3 },
				{ emoji: "🎉", count: 1 },
			],
			Number.NaN,
		);

		expect(partition.visible.map((r) => r.emoji)).toEqual(["👍", "🎉"]);
		expect(partition.hiddenCount).toBe(0);
	});

	it("folds everything past the cap into the hidden count", () => {
		const partition = partitionReactions(
			["👍", "🎉", "😂", "🔥", "🚀"].map((emoji) => ({ emoji, count: 1 })),
			3,
		);

		expect(partition.visible.map((r) => r.emoji)).toEqual(["👍", "🎉", "😂"]);
		expect(partition.hiddenCount).toBe(2);
	});

	it("caps hard — one chip over the limit still folds, it never widens by one", () => {
		// The same stance TypingIndicator's maxNames takes: a consumer that
		// picked the cap gets a predictable row width, not a special case.
		const partition = partitionReactions(
			["👍", "🎉", "😂", "🔥"].map((emoji) => ({ emoji, count: 1 })),
			3,
		);

		expect(partition.visible).toHaveLength(3);
		expect(partition.hiddenCount).toBe(1);
	});

	it("renders in the order given — ordering is the consumer's call", () => {
		const partition = partitionReactions(
			[
				{ emoji: "🎉", count: 1 },
				{ emoji: "👍", count: 99 },
			],
			8,
		);

		// Not re-sorted by count: anker cannot know whether the consumer means
		// "most popular first" or "first reacted first".
		expect(partition.visible.map((r) => r.emoji)).toEqual(["🎉", "👍"]);
	});

	it("floors fractional counts rather than rendering them", () => {
		const partition = partitionReactions([{ emoji: "👍", count: 2.7 }], 8);

		expect(partition.visible[0]?.count).toBe(2);
	});

	it("returns an empty partition for an empty list", () => {
		expect(partitionReactions([], 8)).toEqual({ visible: [], hiddenCount: 0 });
	});
});
