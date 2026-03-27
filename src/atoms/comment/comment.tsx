import { chakra } from "@chakra-ui/react";
import type React from "react";
import { createContext, useContext } from "react";
import { HStack, Stack } from "../../primitives/layout";
import { Prose } from "../../primitives/prose";
import { Button, type ButtonProps } from "../button";
import { RelativeDateTime } from "../datetime/relative-datetime";
import type {
	CommentFooterProps,
	CommentHeaderProps,
	CommentProps,
} from "./types";

type CommentStyles = Record<string, React.CSSProperties | object>;

const CommentStylesContext = createContext<CommentStyles>({});
const useStyles = () => useContext(CommentStylesContext);

export const Comment: React.FC<CommentProps> = (props) => {
	const {
		avatar,
		content,
		children,
		author,
		commentedAt,
		actions,
		id,
		isDeleted,
		deletedLabel = "This comment has been deleted",
		...rest
	} = props;

	const styles: CommentStyles = {};

	const headerProps = {
		author,
		commentedAt,
	};

	const footerProps = {
		actions,
	};

	return (
		<chakra.div css={styles.container} data-id={id} {...rest}>
			<CommentStylesContext.Provider value={styles}>
				{avatar && <AvatarSlot>{avatar}</AvatarSlot>}
				{(content || isDeleted) && (
					<ContentContainer>
						<Stack gap={3}>
							<Stack gap={2}>
								<CommentHeader {...headerProps} />
								<Prose
									css={{
										"& p": {
											fontSize: "inherit!important",
										},
										"& *:first-child": {
											marginTop: 0,
										},
										"& *:last-child": {
											marginBottom: 0,
										},
									}}
								>
									{isDeleted ? (
										<chakra.span css={styles.deletedText}>
											{deletedLabel}
										</chakra.span>
									) : (
										content
									)}
								</Prose>
							</Stack>
							<CommentFooter {...footerProps} />
						</Stack>
					</ContentContainer>
				)}
				{children && (
					<Stack gap={4} css={styles.children}>
						{children}
					</Stack>
				)}
			</CommentStylesContext.Provider>
		</chakra.div>
	);
};

Comment.displayName = "Comment";

const AvatarSlot: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const styles = useStyles();

	return <chakra.div css={styles.avatar}>{children}</chakra.div>;
};

const ContentContainer = ({ children }: { children: React.ReactNode }) => {
	const styles = useStyles();

	return <chakra.div css={styles.contentContainer}>{children}</chakra.div>;
};

const CommentHeader: React.FC<CommentHeaderProps> = (props) => {
	const { author, commentedAt } = props;

	const shouldRender = !!author || !!commentedAt;

	return shouldRender ? (
		<HStack>
			{author && <Author>{author.name}</Author>}
			{commentedAt && <RelativeDateTime date={commentedAt} />}
		</HStack>
	) : null;
};

const Author: React.FC<{
	children: React.ReactNode;
}> = (props) => {
	const { children } = props;
	const styles = useStyles();

	return <chakra.span css={styles.field}>{children}</chakra.span>;
};

const CommentFooter: React.FC<CommentFooterProps> = (props) => {
	const { actions } = props;
	return (
		<HStack alignItems="center" gap={4} flexWrap="wrap">
			{actions?.map((item, key) => Object.assign({}, item, { key }))}
		</HStack>
	);
};

export interface CommentActionProps extends ButtonProps {
	children: React.ReactNode;
}

export const CommentAction: React.FC<CommentActionProps> = (props) => {
	return <Button variant="outline" size="xs" {...props} />;
};
CommentAction.displayName = "CommentAction";
