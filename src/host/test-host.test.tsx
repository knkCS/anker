// src/host/test-host.test.tsx
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import {
	createHostMembers,
	emptyHostIdentity,
	useHostIdentity,
	usePageFrame,
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
});
