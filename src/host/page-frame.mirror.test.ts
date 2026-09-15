// src/host/page-frame.mirror.test.ts
//
// Pins the claim in the contract's doc comment: `PageFrame` mirrors
// `PageHeaderProps` one-to-one (plus the `sticky` presentation hint), so a
// host can spread a reported frame straight into `<PageHeader>`. This file
// is a `.test.ts` on purpose — `tsconfig.json` excludes `*.test.tsx` from
// `npm run typecheck`, and these assertions only bite at compile time.
import { describe, expectTypeOf, it } from "vitest";
import type {
	PageHeaderBreadcrumb,
	PageHeaderProps,
} from "../components/page-header";
import type { PageFrame, PageFrameBreadcrumb } from "./host-contract";

describe("PageFrame mirrors PageHeaderProps", () => {
	it("has exactly the page header's fields plus `sticky`", () => {
		expectTypeOf<Omit<PageFrame, "sticky">>().toEqualTypeOf<PageHeaderProps>();
		expectTypeOf<PageFrameBreadcrumb>().toEqualTypeOf<PageHeaderBreadcrumb>();
	});

	it("a reported frame spreads into PageHeader", () => {
		expectTypeOf<PageFrame>().toMatchTypeOf<PageHeaderProps>();
	});
});
