import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "0.0.0.0";
const DIST_DIR = path.join(__dirname, "dist");
const INDEX_HTML = path.join(DIST_DIR, "index.html");
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
	helmet({
		contentSecurityPolicy: false,
		crossOriginEmbedderPolicy: false,
	})
);

if (process.env.NODE_ENV !== "production") {
	app.use(morgan("dev"));
}

app.get("/health", (req, res) => {
	res.status(200).json({ ok: true });
});

if (!fs.existsSync(INDEX_HTML)) {
	console.error("Build artifacts not found. Run `pnpm build` in client first.");
	process.exit(1);
}

app.use(
	express.static(DIST_DIR, {
		etag: true,
		extensions: ["html"],
		setHeaders(res, filePath) {
			if (filePath.endsWith(".html")) {
				res.setHeader("Cache-Control", "no-cache");
				return;
			}
			res.setHeader("Cache-Control", `public, max-age=${ONE_YEAR_SECONDS}, immutable`);
		},
	})
);

// SPA fallback for client-side routing (Express 5 wildcard syntax).
app.get("/{*path}", (req, res) => {
	res.sendFile(INDEX_HTML);
});

const server = app.listen(PORT, HOST, () => {
	console.log(`Frontend server listening on http://${HOST}:${PORT}`);
});

const shutdown = (signal) => {
	console.log(`${signal} received. Shutting down frontend server...`);
	server.close(() => {
		process.exit(0);
	});
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
