import {
	Toaster as ChakraToaster,
	createToaster,
	Portal,
	Spinner,
	Stack,
	Toast,
} from "@chakra-ui/react";

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

	const ToasterComponent = () => {
		return (
			<Portal>
				<ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
					{(toast) => (
						<Toast.Root width={{ md: "sm" }}>
							{toast.type === "loading" ? (
								<Spinner size="sm" color="primary.solid" />
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

	return { toaster, Toaster: ToasterComponent };
}

// Default instance for convenience
const { toaster, Toaster } = createAnkerToaster();

(Toaster as { displayName?: string }).displayName = "Toaster";

export { toaster, Toaster };
