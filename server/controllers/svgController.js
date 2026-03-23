import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Svg from "../models/Svg.js";
import {
	SVG_UPLOAD_ROOT,
	diskPathForSvg,
	ensureSvgTypeDir,
	urlPathForSvg,
} from "../lib/svgPaths.js";
import { buildSymbolToUrlMap } from "../lib/svgSymbolMap.js";

const TYPE_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export function normalizeThemeType(raw) {
	const s = String(raw ?? "")
		.trim()
		.toLowerCase();
	if (!TYPE_RE.test(s)) {
		throw new Error(
			'Invalid type: use lowercase letters, digits, and hyphens (e.g. "fruit", "holiday-2025").'
		);
	}
	return s;
}

export function nameFromOriginalFilename(originalname) {
	const ext = path.extname(originalname).toLowerCase();
	if (ext !== ".svg") {
		throw new Error("Only .svg files are allowed.");
	}
	const base = path.basename(originalname, ext).trim();
	if (!base) {
		throw new Error("Invalid file name.");
	}
	const name = base.toLowerCase().replace(/[^a-z0-9_]/g, "");
	if (!name || name.length > 32) {
		throw new Error(
			"Name must be 1–32 characters (a–z, 0–9, _) from the file name."
		);
	}
	return name;
}

export const listSvgs = async (req, res) => {
	try {
		const typeRaw = String(req.query.type ?? "").trim().toLowerCase();
		const filter = typeRaw ? { type: typeRaw } : {};
		const items = await Svg.find(filter)
			.sort({ type: 1, name: 1 })
			.lean();
		return res.json({ success: true, data: items });
	} catch (err) {
		console.error("[svgs list]", err);
		return res.status(500).json({ success: false, message: err.message });
	}
};

export const listSvgTypes = async (req, res) => {
	try {
		const types = await Svg.distinct("type");
		types.sort();
		return res.json({ success: true, data: types });
	} catch (err) {
		console.error("[svgs types]", err);
		return res.status(500).json({ success: false, message: err.message });
	}
};

/** Public: map asset name → urlPath for a theme (scratch UI). */
export const getPublicSvgMap = async (req, res) => {
	try {
		const type = String(req.query.type ?? "").trim().toLowerCase();
		if (!type || !TYPE_RE.test(type)) {
			return res.status(400).json({
				success: false,
				message: "Query ?type= is required and must be a valid theme slug.",
			});
		}
		const items = await Svg.find({ type }).lean();
		const symbols = buildSymbolToUrlMap(items);
		return res.json({ success: true, data: { type, symbols } });
	} catch (err) {
		console.error("[svgs public-map]", err);
		return res.status(500).json({ success: false, message: err.message });
	}
};

function unlinkUploaded(file) {
	try {
		if (file?.path && fs.existsSync(file.path)) {
			fs.unlinkSync(file.path);
		}
	} catch {
		/* ignore */
	}
}

export const bulkUploadSvgs = async (req, res) => {
	try {
		const type = normalizeThemeType(req.query.type);
		const files = req.files;
		if (!Array.isArray(files) || files.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No files uploaded. Use field name `files` (multipart).",
			});
		}

		const prepared = [];
		const errors = [];

		for (const file of files) {
			try {
				const name = nameFromOriginalFilename(file.originalname);
				const urlPath = urlPathForSvg(type, name);
				prepared.push({ file, name, urlPath });
			} catch (e) {
				errors.push({ file: file.originalname, message: e.message });
				unlinkUploaded(file);
			}
		}

		if (prepared.length === 0) {
			return res.status(400).json({
				success: false,
				data: [],
				errors,
			});
		}

		const session = await mongoose.startSession();
		let created = [];
		try {
			created = await session.withTransaction(async () => {
				const out = [];
				for (const { file, name, urlPath } of prepared) {
					const doc = await Svg.findOneAndUpdate(
						{ type, name },
						{
							type,
							name,
							urlPath,
							originalFileName: file.originalname,
						},
						{
							upsert: true,
							new: true,
							setDefaultsOnInsert: true,
							session,
						}
					).lean();
					out.push(doc);
				}
				return out;
			});
		} catch (e) {
			for (const { file } of prepared) {
				unlinkUploaded(file);
			}
			errors.push({
				file: "(bulk)",
				message: e.message || "Database transaction failed.",
			});
			return res
				.status(400)
				.json({ success: false, data: [], errors });
		} finally {
			session.endSession();
		}

		return res
			.status(errors.length > 0 && created.length === 0 ? 400 : 200)
			.json({
				success: errors.length === 0,
				data: created,
				errors,
			});
	} catch (err) {
		console.error("[svgs bulk]", err);
		return res.status(400).json({ success: false, message: err.message });
	}
};

export const deleteSvg = async (req, res) => {
	try {
		const { id } = req.params;
		const row = await Svg.findById(id);
		if (!row) {
			return res
				.status(404)
				.json({ success: false, message: "SVG record not found." });
		}
		const disk = diskPathForSvg(row.type, row.name);
		try {
			if (fs.existsSync(disk)) fs.unlinkSync(disk);
		} catch {
			/* ignore */
		}
		await Svg.deleteOne({ _id: id });
		return res.json({ success: true, message: "Deleted." });
	} catch (err) {
		console.error("[svgs delete]", err);
		return res.status(500).json({ success: false, message: err.message });
	}
};

export const deleteSvgsByType = async (req, res) => {
	try {
		let type;
		try {
			type = normalizeThemeType(req.query.type);
		} catch (e) {
			return res.status(400).json({ success: false, message: e.message });
		}
		const rows = await Svg.find({ type }).lean();

		const session = await mongoose.startSession();
		try {
			await session.withTransaction(async () => {
				await Svg.deleteMany({ type }).session(session);
			});
		} finally {
			session.endSession();
		}

		for (const row of rows) {
			const disk = diskPathForSvg(row.type, row.name);
			try {
				if (fs.existsSync(disk)) fs.unlinkSync(disk);
			} catch {
				/* ignore */
			}
		}
		const folder = path.join(SVG_UPLOAD_ROOT, type);
		try {
			fs.rmSync(folder, { recursive: true, force: true });
		} catch {
			/* ignore */
		}
		return res.json({
			success: true,
			message: `Removed theme "${type}" (${rows.length} SVGs).`,
			deletedCount: rows.length,
		});
	} catch (err) {
		console.error("[svgs delete type]", err);
		return res.status(500).json({ success: false, message: err.message });
	}
};
