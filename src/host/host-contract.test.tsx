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
	type ScreenAction,
	useHostIdentity,
	usePageFrame,
	usePageRail,
	useReportedScreenActions,
	useScreenActions,
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

function RailScreen({ rail }: { rail: ReactNode }) {
	usePageRail(rail);
	return <div data-testid="body">body</div>;
}

describe("usePageRail", () => {
	it("reports the rail node to the provider's rail sink", () => {
		const onRailChange = vi.fn();
		const rail = <div data-testid="rail">claim</div>;
		render(
			<HostProvider onRailChange={onRailChange}>
				<RailScreen rail={rail} />
			</HostProvider>,
		);
		expect(onRailChange).toHaveBeenLastCalledWith(rail);
	});

	it("reports again when the node changes, not when an unchanged node re-renders", () => {
		const onRailChange = vi.fn();
		const first = <span>first</span>;
		const second = <span>second</span>;
		function Page() {
			const [useSecond, setUseSecond] = useState(false);
			const [count, setCount] = useState(0);
			usePageRail(useSecond ? second : first);
			return (
				<>
					<button type="button" onClick={() => setCount((c) => c + 1)}>
						bump {count}
					</button>
					<button type="button" onClick={() => setUseSecond(true)}>
						swap
					</button>
				</>
			);
		}
		render(
			<HostProvider onRailChange={onRailChange}>
				<Page />
			</HostProvider>,
		);
		expect(onRailChange).toHaveBeenCalledTimes(1);
		act(() => {
			screen.getByRole("button", { name: /bump/ }).click();
		});
		expect(onRailChange).toHaveBeenCalledTimes(1);
		act(() => {
			screen.getByRole("button", { name: "swap" }).click();
		});
		expect(onRailChange).toHaveBeenLastCalledWith(second);
	});

	it("reports null when the reporting screen unmounts", () => {
		const onRailChange = vi.fn();
		function Host({ children }: { children: ReactNode }) {
			return (
				<HostProvider onRailChange={onRailChange}>{children}</HostProvider>
			);
		}
		const { rerender } = render(
			<Host>
				<RailScreen rail={<div>rail</div>} />
			</Host>,
		);
		expect(onRailChange).toHaveBeenLastCalledWith(expect.anything());
		rerender(
			<Host>
				<div>nothing reports</div>
			</Host>,
		);
		expect(onRailChange).toHaveBeenLastCalledWith(null);
	});

	it("survives a StrictMode remount with the rail still reported", () => {
		const onRailChange = vi.fn();
		const rail = <div>rail</div>;
		render(
			<StrictMode>
				<HostProvider onRailChange={onRailChange}>
					<RailScreen rail={rail} />
				</HostProvider>
			</StrictMode>,
		);
		expect(onRailChange).toHaveBeenLastCalledWith(rail);
	});

	it("is a no-op without a provider", () => {
		expect(() => render(<RailScreen rail={<div>rail</div>} />)).not.toThrow();
		expect(screen.getByTestId("body")).toBeInTheDocument();
	});

	it("travels on its own channel: the frame sink never sees the rail", () => {
		const onFrameChange = vi.fn();
		const onRailChange = vi.fn();
		function Page() {
			usePageFrame({ title: "Task" });
			usePageRail(<div>activity</div>);
			return null;
		}
		render(
			<HostProvider onFrameChange={onFrameChange} onRailChange={onRailChange}>
				<Page />
			</HostProvider>,
		);
		expect(onFrameChange).toHaveBeenCalledTimes(1);
		expect(onFrameChange).toHaveBeenLastCalledWith({ title: "Task" });
		expect(onRailChange).toHaveBeenCalledTimes(1);
	});

	it("keeps a host that stores the rail in state out of a render loop", () => {
		function Host({ children }: { children: ReactNode }) {
			const [rail, setRail] = useState<ReactNode>(null);
			return (
				<>
					<aside data-testid="host-rail">{rail}</aside>
					<HostProvider onRailChange={setRail}>{children}</HostProvider>
				</>
			);
		}
		function Page() {
			// A fresh element every render.
			usePageRail(<span>status tile</span>);
			return null;
		}
		render(
			<Host>
				<Page />
			</Host>,
		);
		expect(screen.getByTestId("host-rail")).toHaveTextContent("status tile");
	});

	it("a nested provider captures rails instead of the outer one", () => {
		const outer = vi.fn();
		const inner = vi.fn();
		render(
			<HostProvider onRailChange={outer}>
				<HostProvider onRailChange={inner}>
					<RailScreen rail={<div>inner</div>} />
				</HostProvider>
			</HostProvider>,
		);
		expect(inner).toHaveBeenCalledTimes(1);
		expect(outer).not.toHaveBeenCalled();
	});
});

function ActionsScreen({ actions }: { actions: readonly ScreenAction[] }) {
	useScreenActions(actions);
	return <div data-testid="body">body</div>;
}

/** What a Host's sidebar does: read the reported actions and draw them. */
function ActionsReadout() {
	const actions = useReportedScreenActions();
	return (
		<ul data-testid="host-actions">
			{actions.map((a) => (
				<li key={a.id}>
					{"to" in a && a.to ? (
						<a href={a.to}>{a.label}</a>
					) : (
						<button type="button" onClick={() => a.onSelect?.()}>
							{a.label}
						</button>
					)}
				</li>
			))}
		</ul>
	);
}

describe("useScreenActions", () => {
	it("reports the screen's actions to the provider's actions sink", () => {
		const onActionsChange = vi.fn();
		const onSelect = vi.fn();
		render(
			<HostProvider onActionsChange={onActionsChange}>
				<ActionsScreen
					actions={[
						{ id: "new-task", label: "New task", shortcut: "N", onSelect },
						{ id: "import", label: "Import", to: "/tasks/import" },
					]}
				/>
			</HostProvider>,
		);
		expect(onActionsChange).toHaveBeenCalledTimes(1);
		const [reported] = onActionsChange.mock.lastCall as [ScreenAction[]];
		expect(reported.map((a) => [a.id, a.label, a.shortcut, a.to])).toEqual([
			["new-task", "New task", "N", undefined],
			["import", "Import", undefined, "/tasks/import"],
		]);
		reported[0].onSelect?.();
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(reported[1].onSelect).toBeUndefined();
	});

	it("carries the icon and the permission predicate to the host untouched", () => {
		const onActionsChange = vi.fn();
		const icon = <svg data-testid="icon" />;
		const isAllowed = () => false;
		render(
			<HostProvider onActionsChange={onActionsChange}>
				<ActionsScreen
					actions={[
						{ id: "a", label: "Archive", icon, isAllowed, onSelect() {} },
					]}
				/>
			</HostProvider>,
		);
		const [reported] = onActionsChange.mock.lastCall as [ScreenAction[]];
		expect(reported[0].icon).toBe(icon);
		expect(reported[0].isAllowed?.()).toBe(false);
	});

	it("does not re-report when only fresh handlers and equal icons are rebuilt", () => {
		const onActionsChange = vi.fn();
		function Page() {
			const [count, setCount] = useState(0);
			// A fresh array, fresh objects, a fresh handler and a fresh icon
			// element with the same props on every render.
			useScreenActions([
				{
					id: "new",
					label: "New task",
					icon: <svg data-size={16} />,
					onSelect: () => setCount(count + 1),
				},
			]);
			return <output data-testid="count">{count}</output>;
		}
		render(
			<HostProvider onActionsChange={onActionsChange}>
				<Page />
				<ActionsReadout />
			</HostProvider>,
		);
		expect(onActionsChange).toHaveBeenCalledTimes(1);
		act(() => {
			screen.getByRole("button", { name: "New task" }).click();
		});
		expect(screen.getByTestId("count")).toHaveTextContent("1");
		expect(onActionsChange).toHaveBeenCalledTimes(1);
		// The held action still runs the screen's LATEST handler, not the
		// closure from the first report.
		act(() => {
			screen.getByRole("button", { name: "New task" }).click();
		});
		expect(screen.getByTestId("count")).toHaveTextContent("2");
		expect(onActionsChange).toHaveBeenCalledTimes(1);
	});

	it("reports again when an action's data changes", () => {
		const onActionsChange = vi.fn();
		function Page() {
			const [archived, setArchived] = useState(false);
			useScreenActions(
				archived
					? [{ id: "restore", label: "Restore", onSelect() {} }]
					: [
							{
								id: "archive",
								label: "Archive",
								onSelect: () => setArchived(true),
							},
						],
			);
			return null;
		}
		render(
			<HostProvider onActionsChange={onActionsChange}>
				<Page />
				<ActionsReadout />
			</HostProvider>,
		);
		act(() => {
			screen.getByRole("button", { name: "Archive" }).click();
		});
		expect(onActionsChange).toHaveBeenCalledTimes(2);
		const [reported] = onActionsChange.mock.lastCall as [ScreenAction[]];
		expect(reported.map((a) => a.label)).toEqual(["Restore"]);
	});

	it("reports again when a handler becomes a route, the route or the predicate changes", () => {
		const onActionsChange = vi.fn();
		const allowed = () => true;
		const denied = () => false;
		const { rerender } = render(
			<HostProvider onActionsChange={onActionsChange}>
				<ActionsScreen actions={[{ id: "x", label: "X", onSelect() {} }]} />
			</HostProvider>,
		);
		rerender(
			<HostProvider onActionsChange={onActionsChange}>
				<ActionsScreen actions={[{ id: "x", label: "X", to: "/x" }]} />
			</HostProvider>,
		);
		expect(onActionsChange).toHaveBeenCalledTimes(2);
		rerender(
			<HostProvider onActionsChange={onActionsChange}>
				<ActionsScreen actions={[{ id: "x", label: "X", to: "/y" }]} />
			</HostProvider>,
		);
		expect(onActionsChange).toHaveBeenCalledTimes(3);
		expect(onActionsChange.mock.lastCall?.[0][0].to).toBe("/y");
		rerender(
			<HostProvider onActionsChange={onActionsChange}>
				<ActionsScreen
					actions={[{ id: "x", label: "X", to: "/y", isAllowed: allowed }]}
				/>
			</HostProvider>,
		);
		rerender(
			<HostProvider onActionsChange={onActionsChange}>
				<ActionsScreen
					actions={[{ id: "x", label: "X", to: "/y", isAllowed: denied }]}
				/>
			</HostProvider>,
		);
		expect(onActionsChange).toHaveBeenCalledTimes(5);
		const [reported] = onActionsChange.mock.lastCall as [ScreenAction[]];
		expect(reported[0].isAllowed?.()).toBe(false);
	});

	it("re-reports when a predicate's answer changes, not when only its closure is fresh", () => {
		const onActionsChange = vi.fn();
		function Page() {
			const [count, setCount] = useState(0);
			const [locked, setLocked] = useState(false);
			// Fresh predicate closures on every render, as written inline.
			useScreenActions([
				{
					id: "edit",
					label: "Edit",
					to: "/edit",
					isAllowed: () => !locked,
				},
			]);
			return (
				<>
					<button type="button" onClick={() => setCount((c) => c + 1)}>
						bump {count}
					</button>
					<button type="button" onClick={() => setLocked(true)}>
						lock
					</button>
				</>
			);
		}
		render(
			<HostProvider onActionsChange={onActionsChange}>
				<Page />
			</HostProvider>,
		);
		expect(onActionsChange).toHaveBeenCalledTimes(1);
		const [held] = onActionsChange.mock.lastCall as [ScreenAction[]];
		act(() => {
			screen.getByRole("button", { name: /bump/ }).click();
		});
		expect(onActionsChange).toHaveBeenCalledTimes(1);
		act(() => {
			screen.getByRole("button", { name: "lock" }).click();
		});
		expect(onActionsChange).toHaveBeenCalledTimes(2);
		const [reported] = onActionsChange.mock.lastCall as [ScreenAction[]];
		expect(reported[0].isAllowed?.()).toBe(false);
		// A predicate the host still holds from the earlier report reads the
		// screen's latest state too.
		expect(held[0].isAllowed?.()).toBe(false);
	});

	it("clears the actions when the reporting screen unmounts", () => {
		const onActionsChange = vi.fn();
		function Host({ children }: { children: ReactNode }) {
			return (
				<HostProvider onActionsChange={onActionsChange}>
					{children}
					<ActionsReadout />
				</HostProvider>
			);
		}
		const { rerender } = render(
			<Host>
				<ActionsScreen actions={[{ id: "a", label: "Archive", to: "/a" }]} />
			</Host>,
		);
		expect(screen.getByTestId("host-actions")).toHaveTextContent("Archive");
		rerender(
			<Host>
				<div>nothing reports</div>
			</Host>,
		);
		expect(onActionsChange).toHaveBeenLastCalledWith([]);
		expect(screen.getByTestId("host-actions")).toBeEmptyDOMElement();
	});

	it("survives a StrictMode remount with the actions still reported", () => {
		const onActionsChange = vi.fn();
		render(
			<StrictMode>
				<HostProvider onActionsChange={onActionsChange}>
					<ActionsScreen actions={[{ id: "a", label: "Archive", to: "/a" }]} />
				</HostProvider>
			</StrictMode>,
		);
		const [reported] = onActionsChange.mock.lastCall as [ScreenAction[]];
		expect(reported.map((a) => a.id)).toEqual(["a"]);
	});

	it("is a no-op without a provider", () => {
		expect(() =>
			render(<ActionsScreen actions={[{ id: "a", label: "A", to: "/a" }]} />),
		).not.toThrow();
		expect(screen.getByTestId("body")).toBeInTheDocument();
	});

	it("travels on its own channel: frame and rail sinks never see the actions", () => {
		const onFrameChange = vi.fn();
		const onRailChange = vi.fn();
		const onActionsChange = vi.fn();
		function Page() {
			usePageFrame({ title: "Task" });
			useScreenActions([{ id: "a", label: "Archive", to: "/a" }]);
			return null;
		}
		render(
			<HostProvider
				onFrameChange={onFrameChange}
				onRailChange={onRailChange}
				onActionsChange={onActionsChange}
			>
				<Page />
			</HostProvider>,
		);
		expect(onFrameChange).toHaveBeenLastCalledWith({ title: "Task" });
		expect(onRailChange).not.toHaveBeenCalled();
		expect(onActionsChange).toHaveBeenCalledTimes(1);
	});

	it("a nested provider captures actions instead of the outer one", () => {
		const outer = vi.fn();
		const inner = vi.fn();
		render(
			<HostProvider onActionsChange={outer}>
				<HostProvider onActionsChange={inner}>
					<ActionsScreen actions={[{ id: "a", label: "A", to: "/a" }]} />
				</HostProvider>
			</HostProvider>,
		);
		expect(inner).toHaveBeenCalledTimes(1);
		expect(outer).not.toHaveBeenCalled();
	});
});

describe("useReportedScreenActions", () => {
	it("returns an empty list without a provider", () => {
		render(<ActionsReadout />);
		expect(screen.getByTestId("host-actions")).toBeEmptyDOMElement();
	});

	it("lets the host read exactly the current screen's actions, and run them", () => {
		const archive = vi.fn();
		function Router({ route }: { route: "tasks" | "settings" }) {
			return route === "tasks" ? (
				<ActionsScreen
					actions={[
						{ id: "archive", label: "Archive", onSelect: archive },
						{ id: "import", label: "Import", to: "/tasks/import" },
					]}
				/>
			) : (
				<ActionsScreen
					actions={[{ id: "invite", label: "Invite", to: "/invite" }]}
				/>
			);
		}
		// The sidebar sits beside the screens under the same provider — as a
		// sidebar passed to <AppShell> does.
		const { rerender } = render(
			<HostProvider>
				<ActionsReadout />
				<Router route="tasks" />
			</HostProvider>,
		);
		const list = screen.getByTestId("host-actions");
		expect(list).toHaveTextContent("ArchiveImport");
		act(() => {
			screen.getByRole("button", { name: "Archive" }).click();
		});
		expect(archive).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("link", { name: "Import" })).toHaveAttribute(
			"href",
			"/tasks/import",
		);
		rerender(
			<HostProvider>
				<ActionsReadout />
				<Router route="settings" />
			</HostProvider>,
		);
		expect(list).toHaveTextContent("Invite");
		expect(list).not.toHaveTextContent("Archive");
	});

	it("does not re-render the screens when the host reads new actions", () => {
		let screenRenders = 0;
		function Page() {
			screenRenders += 1;
			const [n, setN] = useState(0);
			useScreenActions([
				{ id: "bump", label: `Bump ${n}`, onSelect: () => setN(n + 1) },
			]);
			return null;
		}
		render(
			<HostProvider>
				<ActionsReadout />
				<Page />
			</HostProvider>,
		);
		const before = screenRenders;
		act(() => {
			screen.getByRole("button", { name: "Bump 0" }).click();
		});
		expect(screen.getByRole("button", { name: "Bump 1" })).toBeInTheDocument();
		// One render for the screen's own state change; the host reading the
		// new report did not re-render it again.
		expect(screenRenders - before).toBe(1);
	});

	it("reads the nearest provider's actions", () => {
		render(
			<HostProvider>
				<HostProvider>
					<ActionsReadout />
					<ActionsScreen actions={[{ id: "a", label: "Inner", to: "/a" }]} />
				</HostProvider>
			</HostProvider>,
		);
		expect(screen.getByTestId("host-actions")).toHaveTextContent("Inner");
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
