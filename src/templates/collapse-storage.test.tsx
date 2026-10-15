// src/templates/collapse-storage.test.tsx
//
// ContextRail and SubNavLayout remember their collapsed state under
// `storageKey` the way Sidebar does: a missing, blocked or broken storage
// never breaks them, and the state is kept in memory for the session.
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContextRail } from "../components/context-rail/context-rail";
import { NavList } from "../components/nav-list/nav-list";
import { BROKEN_STORAGE_SHAPES, breakLocalStorage } from "../test/storage";
import { SubNavLayout } from "./subnav-layout";

let restore: (() => void) | undefined;
let keySeq = 0;
const nextKey = () => `test.collapse.storage.${++keySeq}`;

const subjects: Array<{
	name: string;
	root: string;
	toggle: string;
	ui: (storageKey: string) => React.ReactElement;
}> = [
	{
		name: "ContextRail",
		root: "context-rail",
		toggle: "context-rail-toggle",
		ui: (storageKey) => <ContextRail storageKey={storageKey}>body</ContextRail>,
	},
	{
		name: "SubNavLayout",
		root: "subnav-layout",
		toggle: "subnav-toggle",
		ui: (storageKey) => (
			<SubNavLayout storageKey={storageKey}>
				<SubNavLayout.Nav>
					<NavList.Group>
						<NavList.Item>X</NavList.Item>
					</NavList.Group>
				</SubNavLayout.Nav>
				<SubNavLayout.Detail>body</SubNavLayout.Detail>
			</SubNavLayout>
		),
	},
];

beforeEach(() => {
	Object.defineProperty(window, "innerWidth", {
		configurable: true,
		value: 1600,
	});
});

afterEach(() => {
	cleanup();
	restore?.();
	restore = undefined;
});

describe.each(subjects)("$name", ({ root, toggle, ui }) => {
	const mount = (key: string) =>
		render(<ChakraProvider value={defaultSystem}>{ui(key)}</ChakraProvider>);
	const collapsed = () =>
		screen.getByTestId(root).getAttribute("data-collapsed");

	it.each(
		BROKEN_STORAGE_SHAPES,
	)("toggles and remembers its state for the session when storage is %s", (shape) => {
		restore = breakLocalStorage(shape);
		const key = nextKey();
		mount(key);
		expect(collapsed()).toBe("false");
		fireEvent.click(screen.getByTestId(toggle));
		expect(collapsed()).toBe("true");
		cleanup();
		mount(key);
		expect(collapsed()).toBe("true");
	});
});
