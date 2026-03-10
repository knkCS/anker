import { Input, type InputProps } from "@chakra-ui/react";
import type React from "react";

export interface DateInputProps
	extends Omit<InputProps, "type" | "value" | "onChange"> {
	/** The date value as an ISO date string (YYYY-MM-DD) or ISO datetime string */
	value?: string;
	/** Called when the date value changes */
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** Minimum date in YYYY-MM-DD format */
	minDate?: string;
	/** Maximum date in YYYY-MM-DD format */
	maxDate?: string;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Extracts a YYYY-MM-DD date string from various input formats.
 */
function toDateString(value: string): string {
	if (!value) return "";
	if (datePattern.test(value)) return value;
	// Try to parse ISO datetime strings
	try {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "";
		return date.toISOString().slice(0, 10);
	} catch {
		return "";
	}
}

const DateInput = ({
	ref,
	...props
}: DateInputProps & { ref?: React.Ref<HTMLInputElement> }) => {
	const { value, minDate, maxDate, onChange, ...rest } = props;

	const dateValue = value ? toDateString(value) : "";

	return (
		<Input
			type="date"
			value={dateValue}
			min={minDate}
			max={maxDate}
			onChange={onChange}
			ref={ref}
			{...rest}
		/>
	);
};

export default DateInput;
