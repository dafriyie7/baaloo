import express from "express";
import multer from "multer";
import userAuth from "../middleware/userAuth.js";
import {
	bulkUploadSvgs,
	deleteSvg,
	deleteSvgsByType,
	getPublicSvgMap,
	listSvgTypes,
	listSvgs,
	nameFromOriginalFilename,
	normalizeThemeType,
} from "../controllers/svgController.js";
import { ensureSvgTypeDir } from "../lib/svgPaths.js";

const storage = multer.diskStorage({
	destination(req, file, cb) {
		try {
			const type = normalizeThemeType(req.query.type);
			cb(null, ensureSvgTypeDir(type));
		} catch (e) {
			cb(e);
		}
	},
	filename(req, file, cb) {
		try {
			const shortName = nameFromOriginalFilename(file.originalname);
			cb(null, `${shortName}.svg`);
		} catch (e) {
			cb(e);
		}
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 512 * 1024, files: 80 },
	fileFilter(req, file, cb) {
		const name = (file.originalname || "").toLowerCase();
		const mime = file.mimetype || "";
		const ok =
			mime === "image/svg+xml" ||
			mime === "image/svg" ||
			(mime === "application/octet-stream" && name.endsWith(".svg"));
		if (ok) cb(null, true);
		else cb(new Error("Only SVG files are allowed"));
	},
});

const svgRouter = express.Router();

svgRouter.get("/public-map", getPublicSvgMap);
svgRouter.get("/types", userAuth, listSvgTypes);
svgRouter.get("/", userAuth, listSvgs);
svgRouter.post(
	"/bulk",
	userAuth,
	(req, res, next) => {
		upload.array("files", 80)(req, res, (err) => {
			if (!err) return next();
			const msg =
				err.message ||
				(err.code === "LIMIT_FILE_SIZE" ? "File too large (max 512 KB)." : "Upload failed.");
			return res.status(400).json({ success: false, message: msg });
		});
	},
	bulkUploadSvgs
);
svgRouter.delete("/by-type", userAuth, deleteSvgsByType);
svgRouter.delete("/:id", userAuth, deleteSvg);

export default svgRouter;
