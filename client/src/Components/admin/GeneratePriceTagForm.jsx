import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "../../../lib/api";
import { useAppcontext } from "../../context/AppContext";
import { Info, Plus, Trash2 } from "lucide-react";

function round2(n) {
	return Math.round(Number(n) * 100) / 100;
}

function formatCount(n) {
	const x = Number(n);
	if (!Number.isFinite(x)) return String(n);
	return Math.trunc(x).toLocaleString();
}

function formatMoney(n) {
	const x = Number(n);
	if (!Number.isFinite(x)) return String(n);
	return x.toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
}

const previewShellClass =
	"rounded-md bg-amber-50 border border-amber-100 p-3 md:p-4 text-sm";

const inputClass =
	"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-700/25 focus:border-amber-700";

const GeneratePriceTagForm = ({ onGenerationSuccess, embeddedInModal }) => {
	const [totalCodes, setTotalCodes] = useState("");
	const [costPerCode, setCostPerCode] = useState("");
	const [giveawayPercentage, setGiveawayPercentage] = useState("60");
	const [cashbackGiveawayPct, setCashbackGiveawayPct] = useState("10");
	const [svgThemeType, setSvgThemeType] = useState("");
	const [themeTypes, setThemeTypes] = useState([]);
	const [themeSvgs, setThemeSvgs] = useState([]);
	const [jackpotSymbolName, setJackpotSymbolName] = useState("");
	const [tierRows, setTierRows] = useState([
		{ symbolName: "", giveawaySharePct: "" },
	]);

	const { currency, isLoading, setIsLoading } = useAppcontext();

	useEffect(() => {
		let c = false;
		(async () => {
			try {
				const { data } = await axios.get("/svgs/types");
				if (!c && data.success) setThemeTypes(data.data ?? []);
			} catch {
				/* ignore */
			}
		})();
		return () => {
			c = true;
		};
	}, []);

	const loadThemeSvgs = useCallback(async (type) => {
		if (!type) {
			setThemeSvgs([]);
			return;
		}
		try {
			const { data } = await axios.get("/svgs", { params: { type } });
			if (data.success) setThemeSvgs(data.data ?? []);
		} catch {
			setThemeSvgs([]);
		}
	}, []);

	useEffect(() => {
		void loadThemeSvgs(svgThemeType);
	}, [svgThemeType, loadThemeSvgs]);

	const symbolOptions = useMemo(() => {
		return themeSvgs
			.filter((s) => {
				const n = String(s.name || "").toLowerCase();
				return n && n !== "loser" && n !== "jackpot";
			})
			.sort((a, b) => String(a.name).localeCompare(String(b.name)));
	}, [themeSvgs]);

	const prizeByName = useMemo(() => {
		const m = {};
		for (const s of themeSvgs) {
			m[String(s.name ?? "")
				.trim()
				.toLowerCase()] = Number(s.prizeAmount) || 0;
		}
		return m;
	}, [themeSvgs]);

	const economicsPreview = useMemo(() => {
		const n = parseInt(totalCodes, 10);
		const cost = Number(costPerCode);
		const g = Number(giveawayPercentage);
		const cb = Number(cashbackGiveawayPct);
		if (
			!Number.isFinite(n) ||
			n < 1 ||
			!Number.isFinite(cost) ||
			cost <= 0 ||
			!Number.isFinite(g) ||
			g < 0 ||
			g > 100 ||
			!Number.isFinite(cb) ||
			cb < 0
		) {
			return null;
		}
		let sumTierRevenuePct = 0;
		for (const row of tierRows) {
			const p = Number(row.giveawaySharePct) || 0;
			if (p > 0) sumTierRevenuePct += p;
		}
		const sumAllRevenuePct = round2(sumTierRevenuePct + cb);
		const revenue = round2(n * cost);
		const targetPool = round2(revenue * (g / 100));

		return {
			revenue,
			pool: targetPool,
			sumTierRevenuePct,
			sumAllRevenuePct,
			okSplit: sumAllRevenuePct <= g + 0.0001,
		};
	}, [totalCodes, costPerCode, giveawayPercentage, cashbackGiveawayPct, tierRows]);

	/** Full ticket economics (mirrors server) when inputs are complete enough. */
	const detailPreview = useMemo(() => {
		if (!economicsPreview?.okSplit) return null;
		const n = parseInt(totalCodes, 10);
		const cost = Number(costPerCode);
		const targetPool = economicsPreview.pool;
		const revenue = economicsPreview.revenue;
		if (!Number.isFinite(n) || n < 1 || !Number.isFinite(cost) || cost <= 0) {
			return null;
		}
		if (!jackpotSymbolName) return null;

		const jpPrize = prizeByName[String(jackpotSymbolName).toLowerCase()];
		if (jpPrize == null || jpPrize <= 0) {
			return {
				error: `Jackpot symbol needs prize > 0 on its SVG (currently ${currency} ${formatMoney(jpPrize ?? 0)}).`,
			};
		}

		let margin = 0;
		const tiers = [];
		let sumTierPct = 0;

		for (const row of tierRows) {
			const sym = String(row.symbolName || "").trim().toLowerCase();
			const pct = Number(row.giveawaySharePct) || 0;
			if (!sym && pct <= 0) continue;
			if (!sym) {
				return {
					error:
						"Each tier row with a giveaway % needs a symbol selected.",
				};
			}
			if (pct <= 0) {
				return { error: `Set % of giveaway for symbol "${sym}".` };
			}
			const price = prizeByName[sym];
			if (price == null || price <= 0) {
				return {
					error: `Symbol "${sym}" needs prize > 0 on its SVG.`,
				};
			}
			const budget = round2(revenue * (pct / 100));
			const count = Math.floor(budget / price);
			const spent = round2(count * price);
			const leftover = round2(budget - spent);
			margin += leftover;
			sumTierPct += pct;
			tiers.push({ sym, pct, price, budget, count, leftover });
		}

		if (tiers.length === 0) {
			return { error: "Add at least one 3× tier with symbol and %." };
		}

		const cbPct = Number(cashbackGiveawayPct) || 0;
		const cbBudget = round2(revenue * (cbPct / 100));
		const cbCount = Math.floor(cbBudget / cost);
		const cbSpent = round2(cbCount * cost);
		margin += round2(cbBudget - cbSpent);

		const sumAll = round2(sumTierPct + cbPct);
		const jackpotRevenueShare = round2(Number(giveawayPercentage) - sumAll);
		const jpBudget = round2(revenue * (jackpotRevenueShare / 100));
		const jpCount = Math.floor(jpBudget / jpPrize);
		const jpSpent = round2(jpCount * jpPrize);
		margin += round2(jpBudget - jpSpent);

		const tierTickets = tiers.reduce((s, t) => s + t.count, 0);
		const used = tierTickets + cbCount + jpCount;
		const losers = n - used;

		return {
			tiers,
			cashback: {
				pct: cbPct,
				budget: cbBudget,
				count: cbCount,
				leftover: round2(cbBudget - cbSpent),
			},
			jackpot: {
				revenuePct: round2(jpBudget / revenue * 100),
				budget: jpBudget,
				prizeEach: jpPrize,
				count: jpCount,
				leftover: round2(jpBudget - jpSpent),
				symbol: jackpotSymbolName,
			},
			margin: round2(margin),
			tierTickets,
			used,
			losers,
		};
	}, [
		economicsPreview,
		totalCodes,
		costPerCode,
		tierRows,
		cashbackGiveawayPct,
		jackpotSymbolName,
		prizeByName,
		giveawayPercentage,
		currency,
	]);

	const addTierRow = () => {
		setTierRows((r) => [...r, { symbolName: "", giveawaySharePct: "" }]);
	};

	const removeTierRow = (idx) => {
		setTierRows((r) => r.filter((_, i) => i !== idx));
	};

	const setTierField = (idx, field, value) => {
		setTierRows((r) =>
			r.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
		);
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		if (isLoading) return;
		if (!svgThemeType.trim()) {
			toast.error("Select an SVG theme.");
			return;
		}
		if (!jackpotSymbolName) {
			toast.error("Select the jackpot (special) symbol.");
			return;
		}
		const n = parseInt(totalCodes, 10);
		const cost = Number(costPerCode);
		if (!Number.isFinite(n) || n < 1 || !Number.isFinite(cost) || cost <= 0) {
			toast.error("Set total codes and price per code.");
			return;
		}
		if (!economicsPreview?.okSplit) {
			toast.error("Tier % + cashback % cannot exceed 100%.");
			return;
		}

		const tierPayouts = [];
		const seen = new Set();
		for (const row of tierRows) {
			const sym = String(row.symbolName || "").trim().toLowerCase();
			const pct = Number(row.giveawaySharePct);
			if (!sym && (!pct || pct <= 0)) continue;
			if (!sym) {
				toast.error("Each tier row needs a symbol.");
				return;
			}
			if (sym === jackpotSymbolName) {
				toast.error("Jackpot symbol cannot be a 3× tier symbol.");
				return;
			}
			if (seen.has(sym)) {
				toast.error(`Duplicate tier symbol: ${sym}`);
				return;
			}
			seen.add(sym);
			if (!Number.isFinite(pct) || pct <= 0) {
				toast.error(`Set giveaway % for symbol ${sym}.`);
				return;
			}
			tierPayouts.push({ symbolName: sym, giveawaySharePct: pct });
		}
		if (tierPayouts.length === 0) {
			toast.error("Add at least one 3× prize tier (symbol + %).");
			return;
		}

		setIsLoading(true);
		try {
			const { data } = await axios.post("/scratch-codes/generate-price-tag", {
				totalCodes: n,
				costPerCode: cost,
				giveawayPercentage: Number(giveawayPercentage),
				svgThemeType: svgThemeType.trim().toLowerCase(),
				cashbackGiveawayPct: Number(cashbackGiveawayPct),
				jackpotSymbolName,
				tierPayouts,
			});
			if (data.success) {
				toast.success(
					data.message +
						(data.batchNumber ? ` (${data.batchNumber})` : "")
				);
				setTotalCodes("");
				setGiveawayPercentage("55");
				setTierRows([{ symbolName: "", giveawaySharePct: "" }]);
				onGenerationSuccess?.();
			} else {
				toast.error(data.message || "Generation failed.");
			}
		} catch (err) {
			toast.error(
				err.response?.data?.message || err.message || "Generation failed."
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form
			onSubmit={onSubmit}
			className={embeddedInModal ? "space-y-6" : "space-y-6 max-w-4xl"}
		>
			<div className="rounded-md border border-gray-200 bg-white p-4 md:p-5 space-y-4">
				<h3 className="text-sm font-semibold text-gray-900">
					Price tag mechanic
				</h3>
				<p className="text-xs text-gray-600">
					Set each SVG&apos;s <strong>prize</strong> in Admin → SVGs. Tier
					symbols pay 3× on the card; jackpot appears once; cashback tickets
					look like losers. Leftover giveaway % funds jackpot (count = pool ÷
					jackpot symbol prize).
				</p>
				{economicsPreview && (
					<div className={previewShellClass}>
						<div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-2">
							<Info className="w-3.5 h-3.5 shrink-0" />
							Preview — base
						</div>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div>
								<p className="text-gray-500">Total codes</p>
								<p className="font-semibold text-gray-900 tabular-nums">
									{formatCount(parseInt(totalCodes, 10) || 0)}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Giveaway % target</p>
								<p className="font-semibold text-gray-900 tabular-nums">
									{formatMoney(Number(giveawayPercentage))}%
								</p>
							</div>
							<div>
								<p className="text-gray-500">Prize pool target</p>
								<p className="font-semibold text-gray-900 tabular-nums">
									{currency} {formatMoney(economicsPreview.pool)}
								</p>
							</div>
						</div>
						<p className="mt-3 text-xs text-gray-600 tabular-nums">
							Jackpot share of giveaway:{" "}
							<span className="font-medium text-gray-800">
								{formatMoney(Number(giveawayPercentage) - economicsPreview.sumAllRevenuePct)}%
							</span>{" "}
							(remainder after tier + cashback %)
							{!economicsPreview.okSplit ? (
								<span className="text-red-700 font-semibold">
									{" "}
									— tiers exceed giveaway %
								</span>
							) : null}
						</p>
					</div>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Theme (SVG type)
						</label>
						<select
							value={svgThemeType}
							onChange={(e) => {
								setSvgThemeType(e.target.value);
								setJackpotSymbolName("");
							}}
							className={inputClass}
							required
						>
							<option value="">— Select —</option>
							{themeTypes.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Jackpot symbol (shows once)
						</label>
						<select
							value={jackpotSymbolName}
							onChange={(e) => setJackpotSymbolName(e.target.value)}
							className={inputClass}
							required
							disabled={!svgThemeType}
						>
							<option value="">— Select —</option>
							{symbolOptions.map((s) => (
								<option key={s._id} value={s.name}>
									{s.name} (prize {currency}{" "}
									{Number(s.prizeAmount ?? 0).toLocaleString()})
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Total codes
						</label>
						<input
							type="number"
							min={1}
							value={totalCodes}
							onChange={(e) => setTotalCodes(e.target.value)}
							className={inputClass}
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Price per code ({currency})
						</label>
						<input
							type="number"
							min={0.01}
							step="0.01"
							value={costPerCode}
							onChange={(e) => setCostPerCode(e.target.value)}
							className={inputClass}
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Giveaway % of Revenue
						</label>
						<input
							type="number"
							min={0}
							max={100}
							step="0.1"
							value={giveawayPercentage}
							onChange={(e) => setGiveawayPercentage(e.target.value)}
							className={inputClass}
							required
						/>
						<p className="text-[10px] text-gray-500 mt-0.5">
							Total jackpot + Tier target.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Cashback % of revenue (stake back, loser look)
						</label>
						<input
							type="number"
							min={0}
							max={100}
							step="0.1"
							value={cashbackGiveawayPct}
							onChange={(e) => setCashbackGiveawayPct(e.target.value)}
							className={inputClass}
						/>
					</div>
				</div>
			</div>

			<div className="rounded-md border border-gray-200 bg-white p-4 md:p-5 space-y-3">
				<div className="flex items-center justify-between gap-2">
					<h3 className="text-sm font-semibold text-gray-900">
						3× prize tiers (% of revenue each)
					</h3>
					<button
						type="button"
						onClick={addTierRow}
						className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
					>
						<Plus className="h-3.5 w-3.5" />
						Add tier
					</button>
				</div>
				{tierRows.map((row, idx) => (
					<div
						key={idx}
						className="flex flex-wrap items-end gap-2 border-b border-gray-100 pb-3 last:border-0"
					>
						<div className="min-w-[10rem] flex-1">
							<label className="block text-xs font-medium text-gray-600">
								Symbol
							</label>
							<select
								value={row.symbolName}
								onChange={(e) =>
									setTierField(idx, "symbolName", e.target.value)
								}
								className={inputClass}
								disabled={!svgThemeType}
							>
								<option value="">—</option>
								{symbolOptions
									.filter((s) => s.name !== jackpotSymbolName)
									.map((s) => (
										<option key={s._id} value={s.name}>
											{s.name} ({currency}{" "}
											{Number(s.prizeAmount ?? 0).toLocaleString()})
										</option>
									))}
							</select>
						</div>
						<div className="w-28">
							<label className="block text-xs font-medium text-gray-600">
								% of revenue
							</label>
							<input
								type="number"
								min={0}
								max={100}
								step="0.1"
								value={row.giveawaySharePct}
								onChange={(e) =>
									setTierField(idx, "giveawaySharePct", e.target.value)
								}
								className={inputClass}
							/>
						</div>
						{tierRows.length > 1 ? (
							<button
								type="button"
								onClick={() => removeTierRow(idx)}
								className="mb-0.5 rounded-md p-2 text-rose-700 hover:bg-rose-50"
								aria-label="Remove tier"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						) : null}
					</div>
				))}

				{detailPreview?.error ? (
					<div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
						{detailPreview.error}
					</div>
				) : null}

				{detailPreview && !detailPreview.error ? (
					<div className={`${previewShellClass} mt-4`}>
						<div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-2">
							<Info className="w-3.5 h-3.5 shrink-0" />
							Preview — ticket counts
						</div>
						<div className="mb-3 space-y-2 text-xs text-gray-700">
							<p className="tabular-nums">
								3× tier winner tickets:{" "}
								<span className="font-semibold text-gray-900">
									{formatCount(detailPreview.tierTickets)}
								</span>
							</p>
							<p className="tabular-nums">
								Cashback tickets:{" "}
								<span className="font-semibold text-gray-900">
									{formatCount(detailPreview.cashback.count)}
								</span>{" "}
								@ {currency} {formatMoney(Number(costPerCode) || 0)} each
							</p>
							<p className="tabular-nums">
								Jackpot tickets:{" "}
								<span className="font-semibold text-gray-900">
									{formatCount(detailPreview.jackpot.count)}
								</span>{" "}
								(
								<span className="font-mono">
									{detailPreview.jackpot.symbol}
								</span>{" "}
								@ {currency}{" "}
								{formatMoney(detailPreview.jackpot.prizeEach)} once per card)
							</p>
							<p className="tabular-nums">
								Plain losers:{" "}
								<span
									className={`font-semibold ${
										detailPreview.losers < 0
											? "text-red-700"
											: "text-gray-900"
									}`}
								>
									{formatCount(detailPreview.losers)}
								</span>
								{detailPreview.losers < 0
									? " — not enough total codes"
									: null}
							</p>
							<div className="pt-1">
								<p className="text-gray-500">House (pool rounding)</p>
								<p className="font-semibold text-gray-900 tabular-nums">
									{currency} {formatMoney(detailPreview.margin)}
								</p>
							</div>
						</div>
						{detailPreview.tiers.length > 0 ? (
							<ul className="space-y-1 border-t border-amber-200/80 pt-3 text-xs text-gray-700">
								{detailPreview.tiers.map((row) => (
									<li key={row.sym} className="tabular-nums">
										<span className="font-mono font-medium">{row.sym}</span>{" "}
										({formatMoney(row.pct)}% of revenue):{" "}
										{formatCount(row.count)} tickets @ {currency}{" "}
										{formatMoney(row.price)} · budget {currency}{" "}
										{formatMoney(row.budget)}
										{row.leftover > 0
											? ` · ${currency} ${formatMoney(row.leftover)} → house`
											: ""}
									</li>
								))}
								<li className="tabular-nums">
									<span className="font-medium">Cashback</span> (
									{formatMoney(detailPreview.cashback.pct)}% of revenue):{" "}
									{formatCount(detailPreview.cashback.count)} tickets · budget{" "}
									{currency} {formatMoney(detailPreview.cashback.budget)}
									{detailPreview.cashback.leftover > 0
										? ` · ${currency} ${formatMoney(detailPreview.cashback.leftover)} → house`
										: ""}
								</li>
								<li className="tabular-nums">
									<span className="font-medium">Jackpot</span> (
									{formatMoney(detailPreview.jackpot.revenuePct)}% of revenue):{" "}
									{formatCount(detailPreview.jackpot.count)} tickets · budget{" "}
									{currency} {formatMoney(detailPreview.jackpot.budget)}
									{detailPreview.jackpot.leftover > 0
										? ` · ${currency} ${formatMoney(detailPreview.jackpot.leftover)} → house`
										: ""}
								</li>
							</ul>
						) : null}
					</div>
				) : null}
			</div>

			<button
				type="submit"
				disabled={
					isLoading ||
					!economicsPreview?.okSplit ||
					!svgThemeType ||
					!jackpotSymbolName ||
					Boolean(detailPreview?.error) ||
					Number(detailPreview?.losers) < 0
				}
				className="w-full sm:w-auto rounded-md bg-amber-800 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-45"
			>
				{isLoading ? "Generating…" : "Generate batch"}
			</button>
		</form>
	);
};

export default GeneratePriceTagForm;
