import {
	Toaster as ChakraToaster,
	createToaster,
	Portal,
	Spinner,
	Stack,
	Toast,
} from "@chakra-ui/react";
import { useEffect, useState, useSyncExternalStore } from "react";

export interface CreateToasterOptions {
	placement?:
		| "top"
		| "top-start"
		| "top-end"
		| "bottom"
		| "bottom-start"
		| "bottom-end";
	pauseOnPageIdle?: boolean;
}

export function createAnkerToaster(options: CreateToasterOptions = {}) {
	const { placement = "bottom-end", pauseOnPageIdle = true } = options;

	const toaster = createToaster({
		placement,
		pauseOnPageIdle,
	});

	// Mount registry: the store is shared per pair, so every mounted region
	// would render every toast. Only the FIRST live <Toaster /> (the owner)
	// renders the region; later mounts render null and take over in mount
	// order when the owner unmounts. Closure-scoped: each
	// createAnkerToaster() pair dedupes independently of every other pair.
	let mounts: symbol[] = [];
	const listeners = new Set<() => void>();
	const subscribe = (listener: () => void) => {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	};
	const getOwner = () => mounts[0];
	const register = (id: symbol) => {
		mounts = [...mounts, id];
		for (const listener of listeners) listener();
	};
	const unregister = (id: symbol) => {
		mounts = mounts.filter((m) => m !== id);
		for (const listener of listeners) listener();
	};

	const ToasterComponent = () => {
		const [id] = useState(() => Symbol("anker-toaster"));
		useEffect(() => {
			register(id);
			return () => unregister(id);
		}, [id]);
		// Server snapshot is undefined: nothing registers during SSR, so no
		// instance renders the region there (it's a portal anyway).
		const owner = useSyncExternalStore(subscribe, getOwner, () => undefined);
		if (owner !== id) return null;
		return (
			<Portal>
				<ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
					{(toast) => (
						<Toast.Root width={{ md: "sm" }}>
							{toast.type === "loading" ? (
								<Spinner size="sm" color="accent" />
							) : (
								<Toast.Indicator />
							)}
							<Stack gap="1" flex="1" maxWidth="100%">
								{toast.title && <Toast.Title>{toast.title}</Toast.Title>}
								{toast.description && (
									<Toast.Description>{toast.description}</Toast.Description>
								)}
							</Stack>
							{toast.action && (
								<Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
							)}
							{toast.closable && <Toast.CloseTrigger />}
						</Toast.Root>
					)}
				</ChakraToaster>
			</Portal>
		);
	};
	ToasterComponent.displayName = "Toaster";

	return { toaster, Toaster: ToasterComponent };
}

// Default instance for convenience
const { toaster, Toaster } = createAnkerToaster();

export { toaster, Toaster };
