import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import axios from "../../../lib/api";
import { SCRATCH_SYMBOL_COUNT } from "../../constants/scratchMechanic";
import { useAppcontext } from "../../context/AppContext";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { ADMIN_MAIN_TITLE_CLASS } from "./AdminPageHeading";

/** r1 = stake back (looks like loser); r3/r5/r7 = max symbol repetitions on the panel. */
const R_KEYS = ["r1", "r3", "r5", "r7"];

function round2(n) {
	return Math.round(Number(n) * 100) / 100;
}

/** Integers with grouping (e.g. 200000 → 200,000). */
function formatCount(n) {
	const x = Number(n);
	if (!Number.isFinite(x)) return String(n);
	return Math.trunc(x).toLocaleString();
}

/** Decimals / percentages with grouping (e.g. 1234.5 → 1,234.5). */
function formatDecimal(n, maxFractionDigits = 2) {
	const x = Number(n);
	if (!Number.isFinite(x)) return String(n);
	return x.toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: maxFractionDigits,
	});
}

/** Currency-style amounts with grouping, up to 2 decimals (e.g. 1000 → 1,000). */
function formatMoney(n) {
	const x = Number(n);
	if (!Number.isFinite(x)) return String(n);
	return x.toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
}

const JACKPOT_PRIZE_ROUND_STEP = 10000;

function floorJackpotPrizeEach(amount) {
	const x = Number(amount);
	if (!Number.isFinite(x) || x < 0) return 0;
	return Math.floor(x / JACKPOT_PRIZE_ROUND_STEP) * JACKPOT_PRIZE_ROUND_STEP;
}

function emptyRTierRows() {
	return Object.fromEntries(
		R_KEYS.map((k) => [k, { pct: "", prize: "" }])
	);
}

const GenerateCodeForm = ({
	onGenerationSuccess,
	embeddedInModal = false,
}) => {
	const [totalCodes, setTotalCodes] = useState("");
	const [costPerCode, setCostPerCode] = useState("");
	const [giveawayPercentage, setGiveawayPercentage] = useState("60");
	const [jackpotCount, setJackpotCount] = useState("12");
	const [rTierRows, setRTierRows] = useState(emptyRTierRows);
	const [symbolSet, setSymbolSet] = useState("");
	const [isMenuOpen, setIsMenuOpen] = useState(true);

	const { currency, isLoading, setIsLoading } = useAppcontext();

	/** Base + tier split + optional jackpot/loser lines (jackpot/loser only when jackpot count ≥ 1). */
	const batchPreview = useMemo(() => {
		const n = parseInt(totalCodes, 10);
		const cost = Number(costPerCode);
		const g = Number(giveawayPercentage);
		if (
			!Number.isFinite(n) ||
			n < 1 ||
			!Number.isFinite(cost) ||
			cost < 0 ||
			!Number.isFinite(g) ||
			g < 0 ||
			g > 100
		) {
			return null;
		}

		const revenue = round2(n * cost);
		const prizePool = round2(revenue * (g / 100));

		let sumRTierShare = 0;
		const tierPreview = [];
		let marginRetained = 0;
		let rTierTickets = 0;

		for (const key of R_KEYS) {
			const pct = Number(rTierRows[key].pct) || 0;
			if (pct <= 0) continue;

			const stake = Number(costPerCode);
			const prize =
				key === "r1"
					? stake
					: Number(rTierRows[key].prize) || 0;

			if (key === "r1") {
				if (!Number.isFinite(stake) || stake <= 0) {
					return {
						revenue,
						prizePool,
						rTierError:
							"R1 (stake back): set price per code > 0 when R1 % is set.",
					};
				}
			} else if (!Number.isFinite(prize) || prize <= 0) {
				return {
					revenue,
					prizePool,
					rTierError: `${key.toUpperCase()}: set prize per winner when % > 0`,
				};
			}

			sumRTierShare += pct;
			const budget = round2(prizePool * (pct / 100));
			const cnt = Math.floor(budget / prize);
			const spent = round2(cnt * prize);
			const leftover = round2(budget - spent);
			marginRetained += leftover;
			rTierTickets += cnt;
			tierPreview.push({
				tier: key,
				budget,
				count: cnt,
				prizeEach: prize,
				leftover,
			});
		}

		if (sumRTierShare > 100.0001) {
			return {
				revenue,
				prizePool,
				rTierError: "R-tier giveaway % sum exceeds 100%.",
			};
		}

		const jackpotGiveawayPct = round2(100 - sumRTierShare);
		const jackpotPool = round2(prizePool * (jackpotGiveawayPct / 100));

		const jCount = parseInt(String(jackpotCount), 10);
		const jackpotReady = Number.isFinite(jCount) && jCount >= 1;

		let jackpotEach;
		let jackpotEachRaw = null;
		let loserCount;
		let ok = true;
		let jackpotError = null;
		if (jackpotReady) {
			const rawEach = round2(jackpotPool / jCount);
			jackpotEachRaw = rawEach;
			jackpotEach = round2(floorJackpotPrizeEach(rawEach));
			const jackpotSpend = round2(jackpotEach * jCount);
			marginRetained = round2(marginRetained + (jackpotPool - jackpotSpend));
			if (jackpotEach <= 0 && jackpotPool > 0.01) {
				ok = false;
				jackpotError = `Jackpot per ticket rounds down to 0 (uses ${formatCount(JACKPOT_PRIZE_ROUND_STEP)}-step prizes). Adjust pool or winner count.`;
			}
			const used = jCount + rTierTickets;
			loserCount = n - used;
			ok = ok && loserCount >= 0;
		}

		return {
			revenue,
			prizePool,
			sumRTierShare,
			jackpotGiveawayPct,
			jackpotPool,
			jackpotEach,
			jackpotEachRaw,
			jackpotCount: jCount,
			jackpotReady,
			jackpotError,
			tierPreview,
			marginRetained: round2(marginRetained),
			rTierTickets,
			loserCount,
			ok,
			rTierError: null,
		};
	}, [totalCodes, costPerCode, giveawayPercentage, jackpotCount, rTierRows]);

	const canSubmit =
		batchPreview &&
		!batchPreview.rTierError &&
		!batchPreview.jackpotError &&
		batchPreview.jackpotReady &&
		batchPreview.ok;

	const previewShellClass =
		"rounded-md bg-amber-50 border border-amber-100 p-3 md:p-4 text-sm";

	const setRTierField = (key, field, value) => {
		setRTierRows((prev) => ({
			...prev,
			[key]: { ...prev[key], [field]: value },
		}));
	};

	const generateCode = async (e) => {
		e.preventDefault();
		if (isLoading) return;

		const n = parseInt(totalCodes, 10);
		const jc = parseInt(String(jackpotCount), 10);
		if (!totalCodes || !costPerCode) {
			toast.error("Fill in total codes and cost per code");
			return;
		}
		if (!Number.isFinite(jc) || jc < 1) {
			toast.error("Jackpot winner count must be at least 1");
			return;
		}
		if (!canSubmit || batchPreview?.rTierError || batchPreview?.jackpotError) {
			toast.error(
				batchPreview?.rTierError ||
					batchPreview?.jackpotError ||
					"Fix R-tier rows and economics"
			);
			return;
		}
		if (!batchPreview.ok) {
			toast.error(
				"Not enough codes for jackpot + R tiers; increase total codes or adjust tiers."
			);
			return;
		}

		const rTierPayouts = [];
		for (const key of R_KEYS) {
			const pct = Number(rTierRows[key].pct) || 0;
			if (pct > 0) {
				if (key === "r1") {
					const stake = Number(costPerCode);
					if (!Number.isFinite(stake) || stake <= 0) {
						toast.error("R1 requires price per code > 0");
						return;
					}
					rTierPayouts.push({
						tier: key,
						giveawaySharePct: pct,
					});
				} else {
					const prize = Number(rTierRows[key].prize) || 0;
					if (!Number.isFinite(prize) || prize <= 0) {
						toast.error(`${key.toUpperCase()}: set prize per winner when % > 0`);
						return;
					}
					rTierPayouts.push({
						tier: key,
						giveawaySharePct: pct,
						prizePerWinner: prize,
					});
				}
			}
		}

		setIsLoading(true);
		const logPrefix = "[GenerateCodeForm] generate-structured";
		try {
			const body = {
				totalCodes: n,
				costPerCode: Number(costPerCode),
				giveawayPercentage: Number(giveawayPercentage),
				jackpotCount: jc,
				rTierPayouts,
			};
			if (symbolSet.trim().length >= SCRATCH_SYMBOL_COUNT) {
				body.symbolSet = symbolSet.trim();
			}

			console.log(logPrefix, "request", {
				totalCodes: n,
				jackpotCount: jc,
				rTierRows: rTierPayouts.length,
				customSymbols: symbolSet.trim().length >= SCRATCH_SYMBOL_COUNT,
			});

			const { data } = await axios.post(
				"/scratch-codes/generate-structured",
				body
			);

			if (data.success) {
				console.log(logPrefix, "ok", {
					batchNumber: data.batchNumber,
					totalCodes: data.totalCodes,
				});
				const id = data.batchNumber ? ` ${data.batchNumber}` : "";
				const margin = data.marginRetainedFromPrizePool;
				const marginNote =
					margin != null && margin > 0
						? ` House retained ${currency} ${formatMoney(margin)} from R-tier rounding.`
						: "";
				toast.success(
					`Batch${id} created — ${formatCount(data.totalCodes)} codes. Jackpot ${currency} ${formatMoney(data.jackpotPrizeEach)} × ${formatCount(jc)}.${marginNote} Refreshing…`
				);
				setTotalCodes("");
				setCostPerCode("");
				setGiveawayPercentage("60");
				setJackpotCount("12");
				setRTierRows(emptyRTierRows());
				setSymbolSet("");
				onGenerationSuccess();
				setIsMenuOpen(false);
			} else {
				console.error(logPrefix, "API success:false", {
					message: data?.message,
					data,
				});
				toast.error(data.message);
			}
		} catch (error) {
			const status = error.response?.status;
			const resData = error.response?.data;
			console.error(logPrefix, "failed", {
				status,
				message: resData?.message ?? error.message,
				response: resData ?? null,
			});
			toast.error(
				error.response?.data?.message ||
					"An error occurred while generating codes."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const outerClass = embeddedInModal
		? "w-full"
		: "w-full max-w-4xl bg-white px-6 py-8 md:px-10 rounded-md shadow-sm border border-gray-100 mb-8";

	const formVisibilityClass = embeddedInModal
		? "space-y-6"
		: `space-y-6 overflow-hidden transition-all duration-300 ${
				isMenuOpen ? "max-h-[8000px] opacity-100" : "max-h-0 opacity-0"
			}`;

	return (
		<div className={outerClass}>
			{embeddedInModal ? (
				<div className="mb-5 space-y-2">
					<p className="text-sm text-gray-600 max-w-3xl">
						<strong>Prize pool</strong> = revenue × giveaway %. Each{" "}
						<strong>R1</strong> = stake back (same symbols as losers; % of
						pool ÷ price/code). 						<strong>R3, R5, R7</strong> = repetition tiers (3 / 5 / 7 of one
						symbol); % + fixed prize per ticket; count ={" "}
						<code>floor(budget ÷ prize)</code>. Leftovers stay with the
						house. <strong>Jackpot</strong> gets the remaining pool %;
						you set winner count.
					</p>
					<p className="text-xs text-gray-500 max-w-3xl font-mono bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
						Batch IDs: <strong>CC-YYMM-PPP</strong> (e.g.{" "}
						<strong>AA-2603-010</strong>) — two-letter counter (AA, AB, … ZZ),
						then year + month, then 3-digit rounded price/code. Pure losers fill
						remaining codes (no prize; max 2 of any symbol).
					</p>
				</div>
			) : (
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
					<div>
						<h2 className={ADMIN_MAIN_TITLE_CLASS}>
							Generate scratch batch
						</h2>
						<p className="mt-1 text-sm text-gray-600 max-w-xl">
							R tiers: R1 stake back (looks like a loser), R3/R5/R7 by
							repetition count, % of pool + prize (counts derived).
							Jackpot = remainder; you set count (≥ 1). Losers = rest.
						</p>
						<p className="mt-2 text-xs text-gray-500 max-w-xl font-mono bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
							Batch IDs: <strong>CC-YYMM-PPP</strong> (e.g.{" "}
							<strong>AA-2603-010</strong>).
						</p>
					</div>
					<button
						type="button"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className="shrink-0 self-center sm:self-start flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						{isMenuOpen ? (
							<>
								Hide form <ChevronUp className="w-4 h-4" />
							</>
						) : (
							<>
								Show form <ChevronDown className="w-4 h-4" />
							</>
						)}
					</button>
				</div>
			)}

			<form onSubmit={generateCode} className={formVisibilityClass}>
				{/* ——— Base ——— */}
				<div className="rounded-md border border-gray-200 bg-white p-4 md:p-5 space-y-4">
					<h3 className="text-sm font-semibold text-gray-900">Base</h3>
					{batchPreview != null && (
						<div className={previewShellClass}>
							<div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-2">
								<Info className="w-3.5 h-3.5 shrink-0" />
								Preview
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
								<div>
									<p className="text-gray-500">Total codes</p>
									<p className="font-semibold text-gray-900 tabular-nums">
										{formatCount(parseInt(totalCodes, 10) || 0)}
									</p>
								</div>
								<div>
									<p className="text-gray-500">Giveaway %</p>
									<p className="font-semibold text-gray-900 tabular-nums">
										{formatDecimal(Number(giveawayPercentage))}%
									</p>
								</div>
								<div>
									<p className="text-gray-500">Total revenue</p>
									<p className="font-semibold text-gray-900 tabular-nums">
										{currency}{" "}
										{formatMoney(batchPreview.revenue)}
									</p>
								</div>
								<div>
									<p className="text-gray-500">Prize pool</p>
									<p className="font-semibold text-gray-900 tabular-nums">
										{currency}{" "}
										{formatMoney(batchPreview.prizePool)}
									</p>
								</div>
							</div>
						</div>
					)}
					{batchPreview?.rTierError && (
						<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
							{batchPreview.rTierError}
						</div>
					)}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<label
								htmlFor="totalCodes"
								className="block text-sm font-medium text-gray-700"
							>
								Total codes
							</label>
							<input
								id="totalCodes"
								value={totalCodes}
								onChange={(e) => setTotalCodes(e.target.value)}
								type="number"
								min={1}
								placeholder="e.g. 200,000"
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-700/25 focus:border-amber-700"
							/>
						</div>
						<div>
							<label
								htmlFor="costPerCode"
								className="block text-sm font-medium text-gray-700"
							>
								Price per code ({currency})
							</label>
							<input
								id="costPerCode"
								value={costPerCode}
								onChange={(e) => setCostPerCode(e.target.value)}
								type="number"
								min={0}
								step="0.01"
								placeholder="e.g. 5"
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-700/25 focus:border-amber-700"
							/>
						</div>
						<div>
							<label
								htmlFor="giveawayPercentage"
								className="block text-sm font-medium text-gray-700"
							>
								Giveaway % of revenue
							</label>
							<input
								id="giveawayPercentage"
								value={giveawayPercentage}
								onChange={(e) => setGiveawayPercentage(e.target.value)}
								type="number"
								min={0}
								max={100}
								step="0.1"
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-700/25 focus:border-amber-700"
							/>
						</div>
					</div>
				</div>

				{/* ——— Jackpot ——— */}
				<div className="rounded-md border border-gray-200 bg-white p-4 md:p-5 space-y-4">
					<h3 className="text-sm font-semibold text-gray-900">Jackpot</h3>
					{batchPreview && !batchPreview.rTierError && (
						<div className={previewShellClass}>
							<div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-2">
								<Info className="w-3.5 h-3.5 shrink-0" />
								Preview
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								<div>
									<p className="text-gray-500">Jackpot % of pool (auto)</p>
									<p className="font-semibold text-gray-900 tabular-nums">
										{formatDecimal(batchPreview.jackpotGiveawayPct)}%
									</p>
								</div>
								<div>
									<p className="text-gray-500">Jackpot pool</p>
									<p className="font-semibold text-gray-900 tabular-nums">
										{currency}{" "}
										{formatMoney(batchPreview.jackpotPool)}
									</p>
								</div>
								<div>
									<p className="text-gray-500">Jackpot each (paid)</p>
									<p className="font-semibold text-gray-900 tabular-nums">
										{batchPreview.jackpotReady ? (
											<>
												{currency}{" "}
												{formatMoney(batchPreview.jackpotEach)}
											</>
										) : (
											<span className="text-gray-500 font-normal">
												Set winner count (≥ 1)
											</span>
										)}
									</p>
									{batchPreview.jackpotReady &&
									batchPreview.jackpotEachRaw != null ? (
										<p className="mt-1 text-xs text-gray-500 tabular-nums">
											Pool ÷ {formatCount(batchPreview.jackpotCount)} ={" "}
											{currency} {formatMoney(batchPreview.jackpotEachRaw)} each
											{Math.abs(
												batchPreview.jackpotEachRaw - batchPreview.jackpotEach
											) > 0.005 ? (
												<>
													{" "}
													→ {currency} {formatMoney(batchPreview.jackpotEach)}{" "}
													paid
												</>
											) : null}
										</p>
									) : null}
								</div>
							</div>
							{batchPreview.jackpotError ? (
								<div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
									{batchPreview.jackpotError}
								</div>
							) : null}
						</div>
					)}
					<div className="max-w-md">
						<label
							htmlFor="jackpotCount"
							className="block text-sm font-medium text-gray-700"
						>
							Number of jackpot winners
						</label>
						<input
							id="jackpotCount"
							value={jackpotCount}
							onChange={(e) => setJackpotCount(e.target.value)}
							type="number"
							min={1}
							step={1}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-700/25 focus:border-amber-700"
						/>
						<p className="mt-1 text-xs text-gray-500">Required, minimum 1.</p>
					</div>
				</div>

				{/* ——— R tiers ——— */}
				<div className="rounded-md border border-gray-200 bg-gray-50/80 p-4 md:p-5 space-y-4">
					<div>
						<h3 className="text-sm font-semibold text-gray-900">R tiers</h3>
						<p className="text-xs text-gray-500 mt-1">
							<strong>R1</strong>: stake back — prize is always price/code;
							card looks like a loser (≤2 of any symbol).{" "}
							<strong>R3, R5, R7</strong>: max 3 / 5 / 7 of one symbol; set %
							and prize per winner. Sum ≤ 100%; remainder → jackpot.
						</p>
					</div>
					{batchPreview && !batchPreview.rTierError && (
						<div className={previewShellClass}>
							<div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-2">
								<Info className="w-3.5 h-3.5 shrink-0" />
								Preview
							</div>
							<div className="mb-3 space-y-2 text-sm">
								<div className="text-xs text-gray-600 tabular-nums space-y-0.5">
									<p>
										R-tier winner tickets:{" "}
										<span className="font-medium text-gray-800">
											{formatCount(batchPreview.rTierTickets)}
										</span>
									</p>
									<p>
										Giveaway to R tiers:{" "}
										<span className="font-medium text-gray-800">
											{formatDecimal(batchPreview.sumRTierShare)}%
										</span>
									</p>
								</div>
								<div>
									<p className="text-gray-500">
										House (R-tier leftovers + jackpot rounding)
									</p>
									<p className="font-semibold text-gray-900 tabular-nums">
										{currency}{" "}
										{formatMoney(batchPreview.marginRetained)}
									</p>
								</div>
							</div>
							{batchPreview.tierPreview.length > 0 ? (
								<ul className="space-y-1 text-xs text-gray-700">
									{batchPreview.tierPreview.map((row) => (
										<li key={row.tier} className="tabular-nums">
											<span className="font-medium uppercase">
												{row.tier}
											</span>
											: {formatCount(row.count)} tickets @ {currency}{" "}
											{formatMoney(row.prizeEach)} · budget {currency}{" "}
											{formatMoney(row.budget)}
											{row.leftover > 0
												? ` · ${currency} ${formatMoney(row.leftover)} → house`
												: ""}
										</li>
									))}
								</ul>
							) : (
								<p className="text-xs text-gray-500">
									No R tiers with % &gt; 0 — full giveaway share goes to
									jackpot.
								</p>
							)}
						</div>
					)}
					<div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-200 text-left text-gray-600">
									<th className="py-2 px-3">Tier</th>
									<th className="py-2 pr-3">% of giveaway</th>
									<th className="py-2 pr-3">
										Prize / winner ({currency})
									</th>
								</tr>
							</thead>
							<tbody>
								{R_KEYS.map((key) => (
									<tr key={key} className="border-b border-gray-100">
										<td className="py-2 px-3 font-mono font-medium">
											{key}
											{key === "r1" ? (
												<span className="ml-1 text-xs font-normal text-gray-500">
													(stake)
												</span>
											) : null}
										</td>
										<td className="py-2 pr-3">
											<input
												type="number"
												min={0}
												max={100}
												step="0.1"
												value={rTierRows[key].pct}
												onChange={(e) =>
													setRTierField(key, "pct", e.target.value)
												}
												className="w-full max-w-[7rem] rounded-md border border-gray-300 px-2 py-1"
											/>
										</td>
										<td className="py-2 pr-3">
											{key === "r1" ? (
												<span className="text-xs text-gray-600 tabular-nums">
													{/* = price/code */}
													{costPerCode
														? ` (${currency} ${formatMoney(costPerCode)})`
														: ""}
												</span>
											) : (
												<input
													type="number"
													min={0}
													step="0.01"
													value={rTierRows[key].prize}
													onChange={(e) =>
														setRTierField(key, "prize", e.target.value)
													}
													className="w-full max-w-[8rem] rounded-md border border-gray-300 px-2 py-1"
												/>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* ——— Losers ——— */}
				<div className="rounded-md border border-gray-200 bg-white p-4 md:p-5 space-y-3">
					<div>
						<h3 className="text-sm font-semibold text-gray-900">Losers</h3>
						<p className="text-xs text-gray-500 mt-1">
							Remaining codes after jackpot, R1, and R3/R5/R7. True losers only
							(no prize; R1 stake-back cards are counted above).
						</p>
					</div>
					{batchPreview && !batchPreview.rTierError && (
						<div className={previewShellClass}>
							<div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-2">
								<Info className="w-3.5 h-3.5 shrink-0" />
								Preview
							</div>
							{batchPreview.jackpotReady ? (
								<p
									className={`text-sm font-semibold tabular-nums ${batchPreview.ok ? "text-gray-900" : "text-red-700"}`}
								>
									{formatCount(batchPreview.loserCount)} loser codes
								</p>
							) : (
								<p className="text-xs text-gray-500">
									Set jackpot winner count (≥ 1) to preview loser count.
								</p>
							)}
						</div>
					)}
				</div>

				<div>
					<label
						htmlFor="symbolSet"
						className="block text-sm font-medium text-gray-700"
					>
						Symbol set (optional)
					</label>
					<p className="text-xs text-gray-500 mt-0.5 mb-1">
						{formatCount(SCRATCH_SYMBOL_COUNT)}+ characters for a custom alphabet;
						otherwise default A–Z. R3/R5/R7 need enough symbols for filler logic.
						Jackpot: 9 matching symbols on the{" "}
						{formatCount(SCRATCH_SYMBOL_COUNT)}-cell panel.
					</p>
					<input
						id="symbolSet"
						value={symbolSet}
						onChange={(e) => setSymbolSet(e.target.value)}
						type="text"
						placeholder="Default: ABCDEFGHIJKLMNOPQRSTUVWXYZ"
						className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-700/25 focus:border-amber-700 font-mono text-sm"
					/>
				</div>

				<div className="flex justify-center pt-2">
					<button
						type="submit"
						disabled={isLoading || !canSubmit}
						className="px-8 py-3 rounded-md text-sm font-semibold text-white bg-amber-800 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isLoading ? "Generating…" : "Generate batch"}
					</button>
				</div>
			</form>
		</div>
	);
};

export default GenerateCodeForm;
