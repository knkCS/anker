export interface LoadOlderGate {
	/** Whether the next threshold crossing may fire. */
	armed: boolean;
}

export const initialLoadOlderGate: LoadOlderGate = { armed: true };

export interface LoadOlderGateInput {
	/** Current scroll distance from the top of the list, in px. */
	distanceFromTop: number;
	/** Distance within which approaching the top fires, in px. */
	threshold: number;
}

/**
 * Edge-triggered gate for the onLoadOlder callback: fires once when the
 * scroll position enters the top threshold, and re-arms only after the
 * position leaves it again.
 */
export function nextLoadOlderGate(
	gate: LoadOlderGate,
	{ distanceFromTop, threshold }: LoadOlderGateInput,
): { gate: LoadOlderGate; shouldFire: boolean } {
	const withinThreshold = distanceFromTop <= threshold;
	if (gate.armed && withinThreshold) {
		return { gate: { armed: false }, shouldFire: true };
	}
	if (!gate.armed && !withinThreshold) {
		return { gate: { armed: true }, shouldFire: false };
	}
	return { gate, shouldFire: false };
}
