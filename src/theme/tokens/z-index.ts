/**
 * Z-index scale for consistent stacking order.
 *
 * dropdown < sticky < overlay < modal < popover < toast
 */
const zIndex = {
	dropdown: { value: 1000 },
	sticky: { value: 1100 },
	overlay: { value: 1300 },
	modal: { value: 1400 },
	popover: { value: 1500 },
	toast: { value: 1700 },
};

export default zIndex;
