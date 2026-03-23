import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Root directory for uploaded SVGs (on disk). */
export const SVG_UPLOAD_ROOT = path.join(
	__dirname,
	"..",
	"uploads",
	"svgs"
);

/** URL prefix (Express static mount is `/uploads`). */
export const SVG_PUBLIC_PREFIX = "/uploads/svgs";

export function diskPathForSvg(type, name) {
	return path.join(SVG_UPLOAD_ROOT, type, `${name}.svg`);
}

export function urlPathForSvg(type, name) {
	return `${SVG_PUBLIC_PREFIX}/${type}/${name}.svg`;
}

export function ensureSvgTypeDir(type) {
	const dir = path.join(SVG_UPLOAD_ROOT, type);
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}
