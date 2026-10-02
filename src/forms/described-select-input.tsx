// Internal to the select fields — not exported from `@knkcs/anker/forms`.
//
// react-select writes the input's `aria-describedby` itself (its placeholder
// or live region) and takes no prop to add to it, so `FormField`'s helper,
// description and error ids would never reach the control. This `Input`
// renderer joins them onto whatever react-select set. It reads them from a
// context rather than closing over them so it can be defined once, at module
// scope: a renderer recreated per render remounts the input and drops focus.
import {
	chakraComponents,
	type GroupBase,
	type InputProps,
} from "chakra-react-select";
import { createContext, useContext } from "react";
import type { BaseOption } from "../atoms/select/types";

export const DescribedByContext = createContext<string | undefined>(undefined);

export const DescribedSelectInput = <T extends BaseOption>(
	props: InputProps<T, boolean, GroupBase<T>>,
) => {
	const fieldIds = useContext(DescribedByContext);
	const describedBy =
		[props["aria-describedby"], fieldIds].filter(Boolean).join(" ") ||
		undefined;
	return <chakraComponents.Input {...props} aria-describedby={describedBy} />;
};
