import axios from "axios";
import crypto from "crypto";
import { logger } from "../lib/logger.js";

/**
 * Shika Creators API client — disbursements (payouts) only.
 * Same base URL for test and production; use sk_test_* or sk_live_*.
 * @see https://api.shikacreators.com
 */
class ShikaCreatorsClient {
	constructor() {
		this.baseURL =
			process.env.SC_BASE_URL || "https://api.shikacreators.com";
		this.apiKey = process.env.SC_GATEWAY_API_KEY;
	}

	generateIdempotencyKey(userId, type, timestamp) {
		return crypto
			.createHash("sha256")
			.update(`${userId}-${type}-${timestamp}`)
			.digest("hex");
	}

	/**
	 * Infer mobile money provider from Ghana phone number (9-digit form after 0/233).
	 */
	getProviderFromPhone(phoneNumber) {
		if (!phoneNumber || typeof phoneNumber !== "string") return null;
		const digits = phoneNumber.replace(/\D/g, "");
		let normalized = digits;
		if (digits.startsWith("233") && digits.length >= 12)
			normalized = digits.slice(3);
		else if (digits.startsWith("0") && digits.length >= 10)
			normalized = digits.slice(1);
		if (normalized.length < 9) return null;
		const prefix2 = normalized.slice(0, 2);
		if (["20", "50"].includes(prefix2)) return "telecel";
		if (["26", "27", "56", "57"].includes(prefix2)) return "airteltigo";
		if (["24", "25", "53", "54", "55", "59"].includes(prefix2)) return "mtn";
		return null;
	}

	async makeRequest(method, endpoint, data = null, headers = {}) {
		if (!this.apiKey) {
			throw new Error("SC_GATEWAY_API_KEY is not configured");
		}

		const url = `${this.baseURL}${endpoint}`;
		const config = {
			method,
			url,
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
				...headers,
			},
		};

		if (data && method !== "GET") {
			config.data = data;
		}

		const authMasked = this.apiKey
			? `Bearer ${this.apiKey.slice(0, 12)}***`
			: "(none)";
		logger.info("SC request", {
			url,
			payload: config.data ?? (method === "GET" ? "(GET)" : null),
			authorization: authMasked,
		});

		try {
			const response = await axios(config);
			logger.info("SC response", {
				url,
				status: response.status,
				data: response.data,
			});
			return response.data;
		} catch (error) {
			logger.error("Shika Creators API request failed", {
				url,
				payload: config.data ?? (method === "GET" ? "(GET)" : null),
				authorization: authMasked,
				error: error.message,
				response: error.response?.data,
				status: error.response?.status,
			});
			throw error;
		}
	}

	/**
	 * Create a disbursement (send money to mobile money, Shika Wallet, or bank).
	 * POST /v1/disbursements
	 */
	async createDisbursement(params, idempotencyKey = null) {
		const {
			amount,
			currency = "GHS",
			destination,
			description,
			reference,
			metadata,
		} = params;

		const dest = { ...destination };
		if (dest.phone_number && !dest.provider && dest.type === "mobile_money") {
			dest.provider =
				this.getProviderFromPhone(dest.phone_number) || undefined;
		}

		const payload = {
			amount: Number(amount),
			destination: dest,
			...(currency && { currency }),
			...(description && { description }),
			...(reference && { reference }),
			...(metadata && { metadata }),
		};

		const key =
			idempotencyKey ||
			this.generateIdempotencyKey(
				params.metadata?.user_id || "disbursement",
				"disbursement",
				Date.now()
			);

		const hdrs = { "X-Idempotency-Key": key };

		return this.makeRequest("POST", "/v1/disbursements", payload, hdrs);
	}

	/**
	 * Retrieve a disbursement by ID.
	 */
	async getDisbursement(disbursementId) {
		return this.makeRequest("GET", `/v1/disbursements/${disbursementId}`);
	}

	/**
	 * List disbursements with optional filters.
	 */
	async listDisbursements(params = {}) {
		const { limit = 10, starting_after, status } = params;
		const searchParams = new URLSearchParams();
		if (limit != null) searchParams.set("limit", String(limit));
		if (starting_after) searchParams.set("starting_after", starting_after);
		if (status) searchParams.set("status", status);
		const query = searchParams.toString();
		const endpoint = query
			? `/v1/disbursements?${query}`
			: "/v1/disbursements";
		return this.makeRequest("GET", endpoint);
	}

	/**
	 * Verify webhook signature (Stripe-style t=..,v1=.. or raw HMAC-SHA256 hex of body).
	 */
	verifySignature(rawBody, signatureHeader, secret, logContext = {}) {
		if (!rawBody || !secret) return false;
		const sigRaw = signatureHeader
			? Array.isArray(signatureHeader)
				? signatureHeader[0]
				: String(signatureHeader)
			: "";
		if (!sigRaw) {
			(logContext.logger || logger).warn?.(
				"Shika webhook: empty signature",
				logContext
			);
			return false;
		}

		const sig = sigRaw.trim();
		const buf = Buffer.isBuffer(rawBody)
			? rawBody
			: Buffer.from(String(rawBody), "utf8");
		const bodyStr = buf.toString("utf8");

		const parts = sig.split(",").map((s) => s.trim());
		const tPart = parts.find((p) => p.startsWith("t="));
		const v1Part = parts.find((p) => p.startsWith("v1="));
		if (tPart && v1Part) {
			const t = tPart.slice(2);
			const v1 = v1Part.slice(3);
			const signed = `${t}.${bodyStr}`;
			const expected = crypto
				.createHmac("sha256", secret)
				.update(signed, "utf8")
				.digest("hex");
			try {
				if (expected.length === v1.length) {
					return crypto.timingSafeEqual(
						Buffer.from(expected, "utf8"),
						Buffer.from(v1, "utf8")
					);
				}
			} catch {
				return false;
			}
		}

		const expectedHex = crypto
			.createHmac("sha256", secret)
			.update(buf)
			.digest("hex");
		const normalized = sig.replace(/^sha256=/i, "").trim();
		try {
			if (normalized.length === expectedHex.length) {
				return crypto.timingSafeEqual(
					Buffer.from(expectedHex, "utf8"),
					Buffer.from(normalized, "utf8")
				);
			}
		} catch {
			/* fall through */
		}

		logger.warn("Shika webhook signature did not match", {
			...logContext,
			sigPrefix: sig.slice(0, 24),
		});
		return false;
	}
}

export default new ShikaCreatorsClient();
