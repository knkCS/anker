// src/host/test-host.tsx
//
// TestHost — a host for package tests. Renders children under the host
// contract, captures the last frame and side rail they reported and lets the test change
// the identity mid-render, so a render-smoke test can assert what a screen
// reports and how it reacts to who is looking.

import {
	type ReactNode,
	type Ref,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import {
	emptyHostIdentity,
	type HostIdentity,
	HostProvider,
	type PageFrame,
	type PageRailSink,
} from "./host-contract";

export interface TestHostHandle {
	/** The last frame a descendant screen reported; `null` when none has (or the last one unmounted). */
	readonly frame: PageFrame | null;
	/** The last side-rail node a descendant screen reported via `usePageRail`; `null` when none has (or the last one unmounted). */
	readonly rail: ReactNode;
	/** The identity currently provided. */
	readonly identity: HostIdentity;
	/** Replace the provided identity; wrap in `act()` as with any state change. */
	setIdentity(identity: HostIdentity): void;
}

export interface TestHostProps {
	/** Initial identity. @default emptyHostIdentity */
	identity?: HostIdentity;
	/** Also receives every report, for tests that prefer a spy over the handle. */
	onFrameChange?: (frame: PageFrame | null) => void;
	/** Also receives every rail report. */
	onRailChange?: PageRailSink;
	ref?: Ref<TestHostHandle>;
	children: ReactNode;
}

/**
 * ```tsx
 * const host = createRef<TestHostHandle>();
 * render(<TestHost ref={host} identity={alice}><TaskDetail /></TestHost>);
 * expect(host.current?.frame?.title).toBe("Fix the build");
 * act(() => host.current?.setIdentity(bob));
 * ```
 *
 * `host.current?.rail` is the last reported rail node — render it to assert
 * on its content.
 *
 * The frame and rail live in refs, not state: reading them never re-renders the
 * screens under test, so a report is observable the moment `render`
 * returns without an `act()` wait.
 */
export function TestHost({
	identity: initialIdentity = emptyHostIdentity,
	onFrameChange,
	onRailChange,
	ref,
	children,
}: TestHostProps) {
	const [identity, setIdentity] = useState<HostIdentity>(initialIdentity);
	const frame = useRef<PageFrame | null>(null);
	const rail = useRef<ReactNode>(null);
	useImperativeHandle(
		ref,
		() => ({
			get frame() {
				return frame.current;
			},
			get rail() {
				return rail.current;
			},
			identity,
			setIdentity,
		}),
		[identity],
	);
	return (
		<HostProvider
			identity={identity}
			onFrameChange={(next) => {
				frame.current = next;
				onFrameChange?.(next);
			}}
			onRailChange={(next) => {
				rail.current = next;
				onRailChange?.(next);
			}}
		>
			{children}
		</HostProvider>
	);
}
TestHost.displayName = "TestHost";
