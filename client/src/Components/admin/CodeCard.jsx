import { useMemo } from "react";
import {
	JACKPOT_MAX_MATCH_COUNT,
	SCRATCH_SYMBOL_COUNT,
} from "../../constants/scratchMechanic";
import { useAppcontext } from "../../context/AppContext";

/** Hex redemption codes: show as XXXX-XXXX-… (20-char new codes, 32-char legacy). */
function formatRedemptionCodeForDisplay(plain) {
	const compact = String(plain)
		.replace(/[^0-9A-Fa-f]/g, "")
		.toUpperCase();
	if (!compact) return String(plain);
	const groups = compact.match(/.{1,4}/g);
	return groups ? groups.join("-") : compact;
}

function normalizeSymbolChars(code) {
	let raw = code.displaySymbols;
	if (Array.isArray(raw)) {
		return raw.map((c) => String(c).charAt(0)).filter(Boolean);
	}
	if (typeof raw === "string" && raw.length > 0) {
		return raw.replace(/\s/g, "").split("");
	}
	const pm = (code.patternMatch || []).join("");
	return pm.length > 0 ? pm.split("") : [];
}

function formatTierLabel(tier) {
	if (!tier || tier === "loser") return "Loser";
	if (tier === "jackpot") return "Jackpot";
	if (tier === "r1") return "R1";
	if (typeof tier === "string" && /^r[357]$/.test(tier)) {
		return tier.toUpperCase();
	}
	return String(tier);
}

/** Explains peak symbol count for the scratch mechanic (shown under tier badge). */
function tierPeakCaption(code) {
	const t = code.tier;
	const m = Number(code.maxMatchCount);
	if (!t || t === "loser") {
		return "At most 2 of any symbol";
	}
	if (t === "jackpot") {
		const n = Number.isFinite(m) && m > 0 ? m : JACKPOT_MAX_MATCH_COUNT;
		return `${n} of a symbol (top prize)`;
	}
	if (t === "r1") {
		return "Money back";
	}
	if (typeof t === "string" && /^r[357]$/.test(t)) {
		const k = parseInt(t.slice(1), 10);
		return Number.isFinite(k) ? `${k} of a symbol` : "";
	}
	if (Number.isFinite(m) && m > 0) {
		return `${m} of a symbol`;
	}
	return "";
}

function tierBadgeClass(tier) {
	if (tier === "jackpot") {
		return "border-amber-300/70 bg-amber-50 text-amber-950";
	}
	if (tier === "loser") {
		return "border-stone-200 bg-stone-50 text-stone-600";
	}
	if (tier === "r1") {
		return "border-sky-200/90 bg-sky-50/90 text-sky-950";
	}
	if (typeof tier === "string" && /^r[357]$/.test(tier)) {
		return "border-emerald-200/90 bg-emerald-50/90 text-emerald-900";
	}
	return "border-stone-200 bg-white text-stone-700";
}

const CodeCard = ({ code }) => {
	const { currency } = useAppcontext();

	const symbolChars = useMemo(() => normalizeSymbolChars(code), [code]);
	const panelGrid = symbolChars.length === SCRATCH_SYMBOL_COUNT;
	const peakCaption = tierPeakCaption(code);

	const fmtMoney = (n) =>
		`${currency} ${Number(n ?? 0).toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		})}`;

	return (
		<article
			className="flex h-full flex-col overflow-hidden rounded-md border border-stone-200/90 bg-white shadow-sm ring-1 ring-black/[0.03] transition-shadow hover:border-amber-200/80 hover:shadow-md print:break-inside-avoid print:shadow-none"
		>
			<div className="flex flex-1 flex-col p-3 sm:p-3.5">
				<div className="rounded-sm border border-stone-100 bg-stone-50/60 p-2">
					<img
						src={code.qrImage}
						alt={`QR for code ${code.code}`}
						className="mx-auto h-auto w-full max-h-[7.5rem] object-contain [image-rendering:crisp-edges]"
					/>
				</div>

				<div
					aria-hidden
					className="my-2.5 border-t border-dashed border-stone-200"
				/>

				<div className="space-y-2">
					<div>
						<p className="text-[0.65rem] font-semibold uppercase tracking-wide text-stone-400">
							Redemption code
						</p>
						<p className="mt-1 break-all rounded-sm border border-stone-200 bg-stone-50/80 px-2 py-1.5 text-center font-mono text-sm font-semibold tracking-wide text-stone-900 sm:text-base">
							{formatRedemptionCodeForDisplay(code.code)}
						</p>
					</div>

					<div>
						<p className="text-[0.65rem] font-semibold uppercase tracking-wide text-stone-400">
							Symbol panel
						</p>
						{panelGrid ? (
							<div
								className="mt-1 grid grid-cols-4 gap-1 rounded-sm border border-stone-200 bg-white p-1.5"
								role="img"
								aria-label="Scratch symbols in four by four grid"
							>
								{symbolChars.map((ch, i) => (
									<div
										key={`${ch}-${i}`}
										className="flex aspect-square items-center justify-center rounded-sm border border-stone-100 bg-stone-50/90 font-mono text-sm font-semibold text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:text-base"
									>
										{ch}
									</div>
								))}
							</div>
						) : (
							<div className="mt-1 flex flex-wrap justify-center gap-1 rounded-sm border border-stone-200 bg-white p-2">
								{symbolChars.length > 0 ? (
									symbolChars.map((ch, i) => (
										<span
											key={`${ch}-${i}`}
											className="inline-flex min-w-[1.75rem] items-center justify-center rounded-sm border border-stone-100 bg-stone-50 px-1.5 py-1 font-mono text-xs font-semibold text-stone-800"
										>
											{ch}
										</span>
									))
								) : (
									<span className="text-xs font-medium text-stone-400">
										—
									</span>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="mt-2 border-t border-stone-100 pt-2">
					<p className="text-[0.65rem] font-semibold uppercase tracking-wide text-stone-400">
						Prize
					</p>
					{code.isWinner ? (
						<p className="mt-0.5 text-center text-base font-bold tabular-nums tracking-tight text-amber-950">
							{fmtMoney(code.prizeAmount)}
						</p>
					) : (
						<p className="mt-0.5 text-center text-xs font-medium text-stone-400">
							No prize
						</p>
					)}
				</div>

				<div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2.5">
					<div className="min-w-0">
						<span
							className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${tierBadgeClass(
								code.tier
							)}`}
						>
							{formatTierLabel(code.tier)}
						</span>
						{peakCaption ? (
							<p className="mt-1 text-[0.62rem] leading-snug text-stone-500">
								{peakCaption}
							</p>
						) : null}
					</div>
					<span
						className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${
							code.isUsed
								? "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80"
								: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80"
						}`}
					>
						{code.isUsed ? "Redeemed" : "Available"}
					</span>
				</div>

			</div>
		</article>
	);
};

export default CodeCard;
