// src/host/index.ts
//
// @knkcs/anker/host — the host contract: the page frame a screen reports and
// the side rail it reports, and the identity a host provides once. See
// docs/adr/0003-host-owns-the-frame-anker-owns-the-contract.md.

export type {
	HostIdentity,
	HostMember,
	HostMembers,
	HostProviderProps,
	PageFrame,
	PageFrameBreadcrumb,
	PageFrameSink,
	PageRailSink,
} from "./host-contract";
export {
	createHostMembers,
	emptyHostIdentity,
	HostProvider,
	useHostIdentity,
	usePageFrame,
	usePageRail,
} from "./host-contract";
export type { TestHostHandle, TestHostProps } from "./test-host";
export { TestHost } from "./test-host";
