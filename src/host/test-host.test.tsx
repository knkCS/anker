// src/host/test-host.test.tsx
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import {
	createHostMembers,
	emptyHostIdentity,
	useHostIdentity,
	usePageFrame,
	usePageRail,
	useScreenActions,
} from "./host-contract";
import { TestHost, type TestHostHandle } from "./test-host";

function TaskList() {
	const identity = useHostIdentity();
	usePageFrame({
		title: "Tasks",
		breadcrumbs: [{ label: "Work" }, { label: "Tasks" }],
		actions: <button type="button">New task</button>,
	});
	return <div data-testid="viewer">{identity.userId}</div>;
}

describe("TestHost", () => {
	it("exposes the last frame a screen reported", () => {
		const host = createRef<TestHostHandle>();
		render(
			<TestHost ref={host}>
				<TaskList />
			</TestHost>,
		);
		expect(host.current?.frame?.title).toBe("Tasks");
		expect(host.current?.frame?.breadcrumbs).toEqual([
			{ label: "Work" },
			{ label: "Tasks" },
		]);
		expect(host.current?.frame?.actions).toBeTruthy();
	});

	it("starts with the empty identity and no frame", () => {
		const host = createRef<TestHostHandle>();
		render(
			<TestHost ref={host}>
				<div>no screen</div>
			</TestHost>,
		);
		expect(host.current?.frame).toBeNull();
		expect(host.current?.identity).toBe(emptyHostIdentity);
	});

	it("takes an initial identity and lets a test change it", () => {
		const host = createRef<TestHostHandle>();
		render(
			<TestHost
				ref={host}
				identity={{
					userId: "u-alice",
					workspaceId: "ws-1",
					members: createHostMembers([]),
				}}
			>
				<TaskList />
			</TestHost>,
		);
		expect(screen.getByTestId("viewer")).toHaveTextContent("u-alice");
		act(() => {
			host.current?.setIdentity({
				userId: "u-bob",
				workspaceId: "ws-1",
				members: createHostMembers([]),
			});
		});
		expect(screen.getByTestId("viewer")).toHaveTextContent("u-bob");
		expect(host.current?.identity.userId).toBe("u-bob");
	});

	it("clears the frame when the screen unmounts", () => {
		const host = createRef<TestHostHandle>();
		const { rerender } = render(
			<TestHost ref={host}>
				<TaskList />
			</TestHost>,
		);
		expect(host.current?.frame).not.toBeNull();
		rerender(
			<TestHost ref={host}>
				<div>gone</div>
			</TestHost>,
		);
		expect(host.current?.frame).toBeNull();
	});

	it("exposes the last rail a screen reported, and clears it on unmount", () => {
		const host = createRef<TestHostHandle>();
		function TaskDetail() {
			usePageRail(<div data-testid="claim-tile">Claim</div>);
			return null;
		}
		const { rerender } = render(
			<TestHost ref={host}>
				<TaskDetail />
			</TestHost>,
		);
		const { getByTestId } = render(<div>{host.current?.rail}</div>);
		expect(getByTestId("claim-tile")).toHaveTextContent("Claim");
		rerender(
			<TestHost ref={host}>
				<div>gone</div>
			</TestHost>,
		);
		expect(host.current?.rail).toBeNull();
	});

	it("starts with no rail, and hands reports to an onRailChange spy", () => {
		const host = createRef<TestHostHandle>();
		const seen: unknown[] = [];
		const { rerender } = render(
			<TestHost ref={host} onRailChange={(rail) => seen.push(rail)}>
				<div>no screen</div>
			</TestHost>,
		);
		expect(host.current?.rail).toBeNull();
		expect(seen).toEqual([]);
		function Screen() {
			usePageRail("rail text");
			return null;
		}
		rerender(
			<TestHost ref={host} onRailChange={(rail) => seen.push(rail)}>
				<Screen />
			</TestHost>,
		);
		expect(seen).toEqual(["rail text"]);
		expect(host.current?.rail).toBe("rail text");
	});

	it("exposes the actions a screen reported, and clears them on unmount", () => {
		const host = createRef<TestHostHandle>();
		let archived = 0;
		function TaskDetail() {
			useScreenActions([
				{ id: "archive", label: "Archive", onSelect: () => archived++ },
				{ id: "history", label: "History", to: "/tasks/1/history" },
			]);
			return null;
		}
		const { rerender } = render(
			<TestHost ref={host}>
				<TaskDetail />
			</TestHost>,
		);
		expect(host.current?.actions.map((a) => a.label)).toEqual([
			"Archive",
			"History",
		]);
		expect(host.current?.actions[1].to).toBe("/tasks/1/history");
		host.current?.actions[0].onSelect?.();
		expect(archived).toBe(1);
		rerender(
			<TestHost ref={host}>
				<div>gone</div>
			</TestHost>,
		);
		expect(host.current?.actions).toEqual([]);
	});

	it("starts with no actions, and hands reports to an onActionsChange spy", () => {
		const host = createRef<TestHostHandle>();
		const seen: string[][] = [];
		const spy = (actions: readonly { id: string }[]) =>
			seen.push(actions.map((a) => a.id));
		const { rerender } = render(
			<TestHost ref={host} onActionsChange={spy}>
				<div>no screen</div>
			</TestHost>,
		);
		expect(host.current?.actions).toEqual([]);
		expect(seen).toEqual([]);
		function Screen() {
			useScreenActions([{ id: "new", label: "New", to: "/new" }]);
			return null;
		}
		rerender(
			<TestHost ref={host} onActionsChange={spy}>
				<Screen />
			</TestHost>,
		);
		expect(seen).toEqual([["new"]]);
	});
});
