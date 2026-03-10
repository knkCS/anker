import { Timeline as ChakraTimeline } from "@chakra-ui/react";

// Pass-through exports for full composition
export const TimelineRoot = ChakraTimeline.Root;
TimelineRoot.displayName = "TimelineRoot";

export const TimelineItem = ChakraTimeline.Item;
TimelineItem.displayName = "TimelineItem";

export const TimelineConnector = ChakraTimeline.Connector;
TimelineConnector.displayName = "TimelineConnector";

export const TimelineSeparator = ChakraTimeline.Separator;
TimelineSeparator.displayName = "TimelineSeparator";

export const TimelineIndicator = ChakraTimeline.Indicator;
TimelineIndicator.displayName = "TimelineIndicator";

export const TimelineContent = ChakraTimeline.Content;
TimelineContent.displayName = "TimelineContent";

export const TimelineTitle = ChakraTimeline.Title;
TimelineTitle.displayName = "TimelineTitle";

export const TimelineDescription = ChakraTimeline.Description;
TimelineDescription.displayName = "TimelineDescription";

export type TimelineRootProps = ChakraTimeline.RootProps;
export type TimelineItemProps = ChakraTimeline.ItemProps;
