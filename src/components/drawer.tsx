import {
	Button,
	Drawer,
	type DrawerRootProps,
	Flex,
	Portal,
	Spacer,
} from "@chakra-ui/react";
import { X } from "lucide-react";

export interface DrawerProps
	extends Omit<DrawerRootProps, "open" | "onOpenChange"> {
	open: boolean;
	onClose(): void;
	title: string | React.ReactNode;
	footerText?: string | React.ReactNode;
	children: React.ReactNode;
	saveLabel?: string;
	closeLabel?: string;
	saveButtonDisabled?: boolean;
	additionalButtons?: React.ReactNode;
	onSave?(): void;
}

export const DrawerRoot: React.FC<DrawerProps> = ({
	children,
	title,
	footerText,
	saveLabel = "Save",
	closeLabel = "Close",
	saveButtonDisabled = false,
	additionalButtons,
	onSave,
	open,
	onClose,
	...rest
}) => {
	return (
		<Drawer.Root
			{...rest}
			open={open}
			onOpenChange={(details) => {
				if (!details.open) {
					onClose();
				}
			}}
		>
			<Portal>
				<Drawer.Backdrop />
				<Drawer.Positioner>
					<Drawer.Content>
						<Drawer.CloseTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								position="absolute"
								top={2}
								right={2}
								aria-label={closeLabel}
							>
								<X size={16} />
							</Button>
						</Drawer.CloseTrigger>

						<Drawer.Header
							bg="bg-surface"
							borderBottom="1px solid"
							borderColor="border"
						>
							<Drawer.Title>{title}</Drawer.Title>
						</Drawer.Header>

						<Drawer.Body>{children}</Drawer.Body>

						<Drawer.Footer
							fontSize="sm"
							bg="bg-subtle"
							borderTop="1px solid"
							borderColor="border"
						>
							{footerText}
							<Spacer />
							<Flex gap={4}>
								{additionalButtons}
								{onSave && (
									<Button
										size="sm"
										variant="solid"
										colorPalette="primary"
										onClick={onSave}
										disabled={saveButtonDisabled}
									>
										{saveLabel}
									</Button>
								)}
							</Flex>
						</Drawer.Footer>
					</Drawer.Content>
				</Drawer.Positioner>
			</Portal>
		</Drawer.Root>
	);
};
