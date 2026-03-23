/** Escape a string for safe use inside a MongoDB `$regex` pattern. */
export function escapeRegex(s) {
	return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
