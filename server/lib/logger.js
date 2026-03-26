import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.resolve(__dirname, "..", "logs");

fs.mkdirSync(logsDir, { recursive: true });

const lineFormat = winston.format.printf(
	({ level, message, timestamp, stack }) => {
		const lvl = level.toUpperCase().padEnd(5);
		if (stack) return `${timestamp} [${lvl}] ${message}\n${stack}`;
		return `${timestamp} [${lvl}] ${message}`;
	}
);

const baseFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
	winston.format.errors({ stack: true }),
	lineFormat
);

export const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "info",
	format: baseFormat,
	transports: [
		new winston.transports.File({
			filename: path.join(logsDir, "error.log"),
			level: "error",
			maxsize: 10 * 1024 * 1024,
			maxFiles: 5,
		}),
		new winston.transports.File({
			filename: path.join(logsDir, "combined.log"),
			maxsize: 10 * 1024 * 1024,
			maxFiles: 5,
		}),
	],
});

if (process.env.LOG_CONSOLE !== "false") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
				winston.format.printf(
					({ level, message, timestamp }) =>
						`${timestamp} ${level}: ${message}`
				)
			),
		})
	);
}

/** Apache-style-ish access line (similar to morgan "combined"). */
function escapeQuotes(s) {
	return String(s ?? "-").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Express middleware: logs each request when the response finishes.
 */
export function httpLogger(req, res, next) {
	const start = Date.now();
	res.on("finish", () => {
		const ms = Date.now() - start;
		const remote =
			req.ip ||
			req.socket?.remoteAddress ||
			(req.headers["x-forwarded-for"] || "").split(",")[0]?.trim() ||
			"-";
		const line = [
			remote,
			`-`,
			`-`,
			`"${req.method} ${req.originalUrl || req.url} HTTP/${req.httpVersion || "1.1"}"`,
			res.statusCode,
			res.get("content-length") ?? "-",
			`"${escapeQuotes(req.get("referer"))}"`,
			`"${escapeQuotes(req.get("user-agent"))}"`,
			`${ms}ms`,
		].join(" ");
		logger.info(line);
	});
	next();
}
