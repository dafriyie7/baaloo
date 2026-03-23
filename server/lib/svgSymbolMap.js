/**
 * Build lookup: Svg.name → urlPath (exact keys only; names match scratch symbol chars).
 */
export function buildSymbolToUrlMap(rows) {
	const map = {};
	for (const row of rows) {
		map[row.name] = row.urlPath;
	}
	return map;
}
