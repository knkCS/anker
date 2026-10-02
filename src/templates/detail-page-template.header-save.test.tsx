// src/templates/detail-page-template.header-save.test.tsx
//
// ADR 0004: the PageHeader Save is the one Save on a tabbed detail page, and
// it shows how many tabs changed. This pins that the existing contract carries
// it with no new template or frame field: a TabDirtyProvider mounted above the
// component that renders the template, a Save node that closes over
// `dirtyTabs`, reported as `actions` — and still correct when a foreign host
// draws it outside every provider the screen mounts.

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, type ReactNode, useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { TestHost, type TestHostHandle } from "../host";
import { TabDirtyProvider, useTabDirty } from "../navigation";
import { DetailPageTemplate } from "./detail-page-template";

function HeaderSave({
	dirtyTabs,
	onSave,
}: {
	dirtyTabs: readonly string[];
	onSave: (tabs: readonly string[]) => void;
}) {
	const n = dirtyTabs.length;
	return (
		<button type="button" disabled={n === 0} onClick={() => onSave(dirtyTabs)}>
			{n === 0 ? "Save" : `Save · ${n} ${n === 1 ? "tab" : "tabs"} changed`}
		</button>
	);
}

function Tab({ id, dirty }: { id: string; dirty: boolean }) {
	const { setTabDirty } = useTabDirty();
	// The draft outlives the tab's mount (it is held above the router outlet),
	// so leaving the tab does not clear its dirty mark.
	useEffect(() => setTabDirty(id, dirty), [id, dirty, setTabDirty]);
	return <div>{id} body</div>;
}

function Layout({
	children,
	onSave,
}: {
	children: ReactNode;
	onSave: (tabs: readonly string[]) => void;
}) {
	const { dirtyTabs } = useTabDirty();
	return (
		<DetailPageTemplate
			title="Blueprint"
			actions={<HeaderSave dirtyTabs={dirtyTabs} onSave={onSave} />}
		>
			{children}
		</DetailPageTemplate>
	);
}

function Screen({
	tab,
	onSave,
}: {
	tab: ReactNode;
	onSave: (tabs: readonly string[]) => void;
}) {
	return (
		<TabDirtyProvider>
			<Layout onSave={onSave}>{tab}</Layout>
		</TabDirtyProvider>
	);
}

describe("one header Save on a tabbed detail page (ADR 0004)", () => {
	it("reports a Save that counts every changed tab and saves them at once, drawn outside the screen's providers", () => {
		const host = createRef<TestHostHandle>();
		const onSave = vi.fn();
		const { rerender } = render(
			<ChakraProvider value={defaultSystem}>
				<TestHost ref={host}>
					<Screen tab={<Tab id="general" dirty={true} />} onSave={onSave} />
				</TestHost>
			</ChakraProvider>,
		);

		// The user moves to the schema tab and edits it; general's draft stays.
		rerender(
			<ChakraProvider value={defaultSystem}>
				<TestHost ref={host}>
					<Screen tab={<Tab id="schema" dirty={true} />} onSave={onSave} />
				</TestHost>
			</ChakraProvider>,
		);

		// A foreign host draws the reported actions in a tree of its own.
		render(<div>{host.current?.frame?.actions}</div>);
		const save = screen.getByRole("button", {
			name: "Save · 2 tabs changed",
		});
		act(() => fireEvent.click(save));
		expect(onSave).toHaveBeenCalledWith(["general", "schema"]);
	});

	it("reports a disabled Save when no tab has changed", () => {
		const host = createRef<TestHostHandle>();
		render(
			<ChakraProvider value={defaultSystem}>
				<TestHost ref={host}>
					<Screen tab={<Tab id="general" dirty={false} />} onSave={vi.fn()} />
				</TestHost>
			</ChakraProvider>,
		);
		render(<div>{host.current?.frame?.actions}</div>);
		expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
	});
});
