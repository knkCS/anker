// src/host/test-host.tsx
//
// TestHost — a host for package tests. Renders children under the host
// contract, captures the last frame they reported and lets the test change
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
} from "./host-contract";

export interface TestHostHandle {
	/** The last frame a descendant screen reported; `null` when none has (or the last one unmounted). */
	readonly frame: PageFrame | null;
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
 * The frame lives in a ref, not state: reading it never re-renders the
 * screens under test, so a report is observable the moment `render`
 * returns without an `act()` wait.
 */
export function TestHost({
	identity: initialIdentity = emptyHostIdentity,
	onFrameChange,
	ref,
	children,
}: TestHostProps) {
	const [identity, setIdentity] = useState<HostIdentity>(initialIdentity);
	const frame = useRef<PageFrame | null>(null);
	useImperativeHandle(
		ref,
		() => ({
			get frame() {
				return frame.current;
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
		>
			{children}
		</HostProvider>
	);
}
TestHost.displayName = "TestHost";
