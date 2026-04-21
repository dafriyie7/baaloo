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
	verifySignature(rawBody, signature, secret, logContext = null) {
		if (!signature || !secret) return false;

		const sigRaw = Array.isArray(signature) ? signature[0] : signature;
		const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), "utf8");
		const bodyUtf8 = body.toString("utf8");

		// Shika uses Stripe-style: t=timestamp,v1=hex_signature. Signed payload = "timestamp.body"
		const stripeParts = sigRaw
			.trim()
			.split(",")
			.reduce((acc, p) => {
				const eq = p.indexOf("=");
				if (eq > 0) {
					acc[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
				}
				return acc;
			}, {});
		if (stripeParts.t != null && stripeParts.v1 != null && /^[a-fA-F0-9]{64}$/.test(stripeParts.v1)) {
			const signedPayload = `${stripeParts.t}.${bodyUtf8}`;
			const tryStripe = (hmacSecret) => {
				const computed = crypto.createHmac("sha256", hmacSecret).update(signedPayload, "utf8").digest("hex");
				try {
					return crypto.timingSafeEqual(
						Buffer.from(stripeParts.v1, "hex"),
						Buffer.from(computed, "hex"),
					);
				} catch (e) {
					return false;
				}
			};
			if (tryStripe(secret)) return true;
			if (secret.startsWith("whsec_") && tryStripe(secret.slice(6))) return true;
		}

		// Extract value: "sha256=hex" or "v1=hex" or raw hex (64 chars) or raw base64 (44 chars)
		const extract = (val) => {
			const trimmed = val.trim();
			for (const prefix of ["sha256=", "v1="]) {
				if (trimmed.startsWith(prefix)) return { value: trimmed.slice(prefix.length).trim(), format: "hex" };
			}
			if (/^[A-Za-z0-9+/]+=*$/.test(trimmed) && trimmed.length === 44) return { value: trimmed, format: "base64" };
			if (/^[a-fA-F0-9]{64}$/.test(trimmed)) return { value: trimmed, format: "hex" };
			return { value: trimmed, format: "hex" };
		};

		const { value: expected, format: expectedFormat } = extract(sigRaw);

		const tryVerifyHex = (hmacSecret) => {
			const computedHex = crypto.createHmac("sha256", hmacSecret).update(body).digest("hex");
			if (expectedFormat === "base64") {
				const computedBase64 = crypto.createHmac("sha256", hmacSecret).update(body).digest("base64");
				try {
					return crypto.timingSafeEqual(Buffer.from(computedBase64, "utf8"), Buffer.from(expected, "utf8"));
				} catch (e) {
					return false;
				}
			}
			try {
				const bufExpected = Buffer.from(expected, "hex");
				const bufComputed = Buffer.from(computedHex, "hex");
				return bufExpected.length === 32 && bufComputed.length === 32 && crypto.timingSafeEqual(bufExpected, bufComputed);
			} catch (e) {
				return false;
			}
		};

		if (tryVerifyHex(secret)) return true;
		if (secret.startsWith("whsec_") && tryVerifyHex(secret.slice(6))) return true;

		if (logContext?.logger) {
			logContext.logger.warn("Shika webhook signature invalid", {
				eventId: logContext.eventId,
				eventType: logContext.eventType,
				secretPrefix: secret.slice(0, 6),
				secretIsApiKey: secret.startsWith("sk_"),
			});
		}
		return false;
	}
}

export default new ShikaCreatorsClient();
