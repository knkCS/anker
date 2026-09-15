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
});
