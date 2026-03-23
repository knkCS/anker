import {
	Drawer,
	type DrawerRootProps,
	Flex,
	Portal,
	Spacer,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { Button } from "../atoms/button";

export interface DrawerProps
	extends Omit<DrawerRootProps, "open" | "onOpenChange"> {
	/** Whether the drawer is open. */
	open: boolean;
	/** Called when the drawer should close. */
	onClose(): void;
	/** Header title content. */
	title: string | React.ReactNode;
	/** Text displayed in the footer area (left side). */
	footerText?: string | React.ReactNode;
	/** Drawer body content. */
	children: React.ReactNode;
	/** Label for the save button. @default "Save" */
	saveLabel?: string;
	/** Label for the close button. @default "Close" */
	closeLabel?: string;
	/** Whether the save button is disabled. */
	saveButtonDisabled?: boolean;
	/** Whether the save action is in progress. Shows spinner on save button. */
	loading?: boolean;
	/** Extra buttons rendered before the save button. */
	additionalButtons?: React.ReactNode;
	/** Called when the save button is clicked. If not provided, no save button is shown. */
	onSave?(): void;
}

export const DrawerRoot: React.FC<DrawerProps> = ({
	children,
	title,
	footerText,
	saveLabel = "Save",
	closeLabel = "Close",
	saveButtonDisabled = false,
	loading = false,
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
								insetInlineEnd={2}
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
										disabled={saveButtonDisabled || loading}
										loading={loading}
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
DrawerRoot.displayName = "DrawerRoot";
