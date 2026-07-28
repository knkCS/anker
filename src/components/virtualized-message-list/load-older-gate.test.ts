import { describe, expect, it } from "vitest";
import { initialLoadOlderGate, nextLoadOlderGate } from "./load-older-gate";

/** Runs a scroll-distance sequence through the gate, recording each fire. */
function run(distances: number[], threshold: number): boolean[] {
	let gate = initialLoadOlderGate;
	return distances.map((distanceFromTop) => {
		const result = nextLoadOlderGate(gate, { distanceFromTop, threshold });
		gate = result.gate;
		return result.shouldFire;
	});
}

describe("nextLoadOlderGate", () => {
	it("fires exactly once while the user stays within the top threshold", () => {
		expect(run([500, 150, 90, 50], 200)).toEqual([false, true, false, false]);
	});

	it("re-arms after leaving the threshold and fires again on the next approach", () => {
		expect(run([150, 400, 80], 200)).toEqual([true, false, true]);
	});

	it("fires at exactly the threshold distance", () => {
		expect(run([200], 200)).toEqual([true]);
	});

	it("does not re-arm while still within the threshold", () => {
		expect(run([100, 100, 100], 200)).toEqual([true, false, false]);
	});
});
