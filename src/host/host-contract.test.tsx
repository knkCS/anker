// src/host/host-contract.test.tsx
import { act, render, screen } from "@testing-library/react";
import { type ReactNode, StrictMode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
	createHostMembers,
	emptyHostIdentity,
	type HostIdentity,
	HostProvider,
	type PageFrame,
	useHostIdentity,
	usePageFrame,
} from "./host-contract";

const alice: HostIdentity = {
	userId: "u-alice",
	workspaceId: "ws-1",
	members: createHostMembers([
		{ userId: "u-alice", displayName: "Alice", email: "alice@example.test" },
		{ userId: "u-bob", displayName: "Bob" },
	]),
};

function Screen({ frame }: { frame: PageFrame }) {
	usePageFrame(frame);
	return <div data-testid="body">body</div>;
}

function IdentityReadout() {
	const identity = useHostIdentity();
	return (
		<div data-testid="identity">
			{identity.userId}|{identity.workspaceId}|{identity.members.list().length}
		</div>
	);
}

describe("usePageFrame", () => {
	it("reports the frame to the provider's sink after commit", () => {
		const onFrameChange = vi.fn();
		render(
			<HostProvider identity={alice} onFrameChange={onFrameChange}>
				<Screen frame={{ title: "Tasks", eyebrow: "Work" }} />
			</HostProvider>,
		);
		expect(onFrameChange).toHaveBeenLastCalledWith({
			title: "Tasks",
			eyebrow: "Work",
		});
	});

	it("reports again when the frame changes", () => {
		const onFrameChange = vi.fn();
		function Page() {
			const [title, setTitle] = useState("Draft");
			usePageFrame({ title });
			return (
				<button type="button" onClick={() => setTitle("Published")}>
					publish
				</button>
			);
		}
		render(
			<HostProvider onFrameChange={onFrameChange}>
				<Page />
			</HostProvider>,
		);
		expect(onFrameChange).toHaveBeenLastCalledWith({ title: "Draft" });
		act(() => {
			screen.getByRole("button").click();
		});
		expect(onFrameChange).toHaveBeenLastCalledWith({ title: "Published" });
	});

	it("does not re-report a frame whose values did not change", () => {
		const onFrameChange = vi.fn();
		function Page() {
			const [count, setCount] = useState(0);
			// A fresh object and a fresh breadcrumbs array on every render, with
			// the same values — the body state change must not reach the host.
			usePageFrame({
				title: "Tasks",
				breadcrumbs: [{ label: "Work", to: "/work" }, { label: "Tasks" }],
			});
			return (
				<button type="button" onClick={() => setCount((c) => c + 1)}>
					{count}
				</button>
			);
		}
		render(
			<HostProvider onFrameChange={onFrameChange}>
				<Page />
			</HostProvider>,
		);
		expect(onFrameChange).toHaveBeenCalledTimes(1);
		act(() => {
			screen.getByRole("button").click();
		});
		expect(screen.getByRole("button")).toHaveTextContent("1");
		expect(onFrameChange).toHaveBeenCalledTimes(1);
	});

	it("reports null when the reporting screen unmounts", () => {
		const onFrameChange = vi.fn();
		function Host({ children }: { children: ReactNode }) {
			return (
				<HostProvider onFrameChange={onFrameChange}>{children}</HostProvider>
			);
		}
		const { rerender } = render(
			<Host>
				<Screen frame={{ title: "Tasks" }} />
			</Host>,
		);
		expect(onFrameChange).toHaveBeenLastCalledWith({ title: "Tasks" });
		rerender(
			<Host>
				<div>nothing reports</div>
			</Host>,
		);
		expect(onFrameChange).toHaveBeenLastCalledWith(null);
	});

	it("survives a StrictMode remount with the frame still reported", () => {
		const onFrameChange = vi.fn();
		render(
			<StrictMode>
				<HostProvider onFrameChange={onFrameChange}>
					<Screen frame={{ title: "Tasks" }} />
				</HostProvider>
			</StrictMode>,
		);
		expect(onFrameChange).toHaveBeenLastCalledWith({ title: "Tasks" });
	});

	it("is a no-op without a provider", () => {
		expect(() =>
			render(<Screen frame={{ title: "Standalone" }} />),
		).not.toThrow();
		expect(screen.getByTestId("body")).toBeInTheDocument();
	});

	it("keeps a host that stores the frame in state out of a render loop", () => {
		// The documented host shape: state lives in a component that receives
		// the screens as `children`, so its own re-render does not re-create
		// the screen tree. A screen whose frame carries a fresh element every
		// render must still settle.
		function Host({ children }: { children: ReactNode }) {
			const [frame, setFrame] = useState<PageFrame | null>(null);
			return (
				<>
					<h1 data-testid="host-title">{frame?.title}</h1>
					<HostProvider onFrameChange={setFrame}>{children}</HostProvider>
				</>
			);
		}
		render(
			<Host>
				<Screen frame={{ title: "Tasks", actions: <button type="button" /> }} />
			</Host>,
		);
		expect(screen.getByTestId("host-title")).toHaveTextContent("Tasks");
	});
});

describe("useHostIdentity", () => {
	it("returns the documented empty default without a provider", () => {
		render(<IdentityReadout />);
		expect(screen.getByTestId("identity")).toHaveTextContent("||0");
	});

	it("the empty default has an empty members accessor", () => {
		expect(emptyHostIdentity.userId).toBe("");
		expect(emptyHostIdentity.workspaceId).toBe("");
		expect(emptyHostIdentity.members.list()).toEqual([]);
		expect(emptyHostIdentity.members.byId("u-alice")).toBeUndefined();
	});

	it("returns the identity the provider was given", () => {
		render(
			<HostProvider identity={alice}>
				<IdentityReadout />
			</HostProvider>,
		);
		expect(screen.getByTestId("identity")).toHaveTextContent("u-alice|ws-1|2");
	});

	it("a nested provider without an identity inherits its parent's", () => {
		render(
			<HostProvider identity={alice}>
				<HostProvider onFrameChange={() => undefined}>
					<IdentityReadout />
				</HostProvider>
			</HostProvider>,
		);
		expect(screen.getByTestId("identity")).toHaveTextContent("u-alice|ws-1|2");
	});

	it("a nested provider with its own identity wins over the parent's", () => {
		render(
			<HostProvider identity={alice}>
				<HostProvider
					identity={{ ...alice, userId: "u-bob", workspaceId: "ws-2" }}
				>
					<IdentityReadout />
				</HostProvider>
			</HostProvider>,
		);
		expect(screen.getByTestId("identity")).toHaveTextContent("u-bob|ws-2|2");
	});

	it("a nested provider captures frames instead of the outer one", () => {
		const outer = vi.fn();
		const inner = vi.fn();
		render(
			<HostProvider identity={alice} onFrameChange={outer}>
				<HostProvider onFrameChange={inner}>
					<Screen frame={{ title: "Inner" }} />
				</HostProvider>
			</HostProvider>,
		);
		expect(inner).toHaveBeenLastCalledWith({ title: "Inner" });
		expect(outer).not.toHaveBeenCalled();
	});
});

describe("createHostMembers", () => {
	it("lists the members and looks one up by user id", () => {
		const members = createHostMembers([
			{ userId: "u-alice", displayName: "Alice" },
			{ userId: "u-bob", displayName: "Bob" },
		]);
		expect(members.list().map((m) => m.displayName)).toEqual(["Alice", "Bob"]);
		expect(members.byId("u-bob")?.displayName).toBe("Bob");
		expect(members.byId("u-nobody")).toBeUndefined();
	});
});
