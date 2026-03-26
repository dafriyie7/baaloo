/**
 * Ghana-focused helpers for comparing stored player phones (often numeric / no leading 0)
 * with user input and for Shika mobile_money destinations.
 */

export function digitsOnly(input) {
	return String(input ?? "").replace(/\D/g, "");
}

/** Last 9 digits of local mobile (after optional 233 / leading 0). */
export function ghanaLocalNine(input) {
	let d = digitsOnly(input);
	if (d.startsWith("233") && d.length >= 12) d = d.slice(3);
	else if (d.startsWith("0") && d.length >= 10) d = d.slice(1);
	return d.length >= 9 ? d.slice(-9) : d;
}

export function phonesMatch(a, b) {
	return ghanaLocalNine(a) === ghanaLocalNine(b) && ghanaLocalNine(a).length === 9;
}

/** Prefer 0-prefixed 10-digit local form for APIs that infer provider from prefix. */
export function formatPhoneForGhanaMoMo(input) {
	const nine = ghanaLocalNine(input);
	if (nine.length !== 9) return null;
	return `0${nine}`;
}
