import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const KEY = crypto.scryptSync(process.env.CRYPTO_SECRET, "scratch_salt", 32); // derive 256-bit key

export const encrypt = (text) => {
	const iv = crypto.randomBytes(IV_LEN);
	const cipher = crypto.createCipheriv(ALGO, KEY, iv);
	const encrypted = Buffer.concat([
		cipher.update(text, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return `${iv.toString("base64")}:${encrypted.toString(
		"base64"
	)}:${tag.toString("base64")}`;
};

export const decrypt = (enc) => {
	const [ivB64, ctB64, tagB64] = enc.split(":");
	const iv = Buffer.from(ivB64, "base64");
	const ciphertext = Buffer.from(ctB64, "base64");
	const tag = Buffer.from(tagB64, "base64");
	const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	]).toString("utf8");
};

export const hashForLookup = (code) => {
	return crypto.createHash("sha256").update(code).digest("hex");
};
