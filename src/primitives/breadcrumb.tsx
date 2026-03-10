import { Breadcrumb as ChakraBreadcrumb } from "@chakra-ui/react";

// Pass-through exports with stable API
export const BreadcrumbRoot = ChakraBreadcrumb.Root;
BreadcrumbRoot.displayName = "BreadcrumbRoot";

export const BreadcrumbList = ChakraBreadcrumb.List;
BreadcrumbList.displayName = "BreadcrumbList";

export const BreadcrumbItem = ChakraBreadcrumb.Item;
BreadcrumbItem.displayName = "BreadcrumbItem";

export const BreadcrumbLink = ChakraBreadcrumb.Link;
BreadcrumbLink.displayName = "BreadcrumbLink";

export const BreadcrumbCurrentLink = ChakraBreadcrumb.CurrentLink;
BreadcrumbCurrentLink.displayName = "BreadcrumbCurrentLink";

export const BreadcrumbSeparator = ChakraBreadcrumb.Separator;
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export const BreadcrumbEllipsis = ChakraBreadcrumb.Ellipsis;
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export type BreadcrumbRootProps = ChakraBreadcrumb.RootProps;
export type BreadcrumbLinkProps = ChakraBreadcrumb.LinkProps;
