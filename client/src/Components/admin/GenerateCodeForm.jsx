import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import axios from "../../../lib/api";
import { useAppcontext } from "../../context/AppContext";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

const TIER_KEYS = [
	{ key: "loser", label: "Loser (no 3+ match)", hint: "Max 2 of any symbol" },
	{ key: "jackpot", label: "Jackpot (9 match)", hint: "All same symbol" },
	{ key: "m3", label: "3 of a kind", hint: "Tier m3" },
	{ key: "m4", label: "4 of a kind", hint: "Tier m4" },
	{ key: "m5", label: "5 of a kind", hint: "Tier m5" },
	{ key: "m6", label: "6 of a kind", hint: "Tier m6" },
	{ key: "m7", label: "7 of a kind", hint: "Tier m7" },
	{ key: "m8", label: "8 of a kind", hint: "Tier m8" },
];

const M_KEYS = ["m3", "m4", "m5", "m6", "m7", "m8"];

const DEFAULT_TIERS = {
	loser: 94.5,
	jackpot: 0.1,
	m3: 4,
	m4: 1,
	m5: 0.4,
	m6: 0,
	m7: 0,
	m8: 0,
};

const DEFAULT_WEIGHTS = {
	m3: 1,
	m4: 2,
	m5: 5,
	m6: 5,
	m7: 10,
	m8: 15,
};

function round2(n) {
	return Math.round(Number(n) * 100) / 100;
}

const GenerateCodeForm = ({ onGenerationSuccess }) => {
	const [totalCodes, setTotalCodes] = useState("");
	const [costPerCode, setCostPerCode] = useState("");
	const [giveawayPercentage, setGiveawayPercentage] = useState("20");
	const [jackpotGiveawayPercentage, setJackpotGiveawayPercentage] =
		useState("15");
	const [tierPercents, setTierPercents] = useState({ ...DEFAULT_TIERS });
	const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
	const [symbolSet, setSymbolSet] = useState("");
	const [isMenuOpen, setIsMenuOpen] = useState(true);

	const { currency, isLoading, setIsLoading } = useAppcontext();

	const tierSum = useMemo(
		() =>
			round2(
				TIER_KEYS.reduce((s, { key }) => s + Number(tierPercents[key] || 0), 0)
			),
		[tierPercents]
	);

	const tierSumOk = tierSum >= 99.5 && tierSum <= 100.5;

	const preview = useMemo(() => {
		const n = parseInt(totalCodes, 10);
		const cost = Number(costPerCode);
		const g = Number(giveawayPercentage);
		const j = Number(jackpotGiveawayPercentage);
		if (
			!Number.isFinite(n) ||
			n < 1 ||
			!Number.isFinite(cost) ||
			cost < 0 ||
			!Number.isFinite(g) ||
			!Number.isFinite(j)
		) {
			return null;
		}
		const revenue = round2(n * cost);
		const prizePool = round2(revenue * (g / 100));
		const jackpotPool = round2(prizePool * (j / 100));
		const otherPool = round2(prizePool - jackpotPool);
		const jackpotTickets = Math.round(
			(n * Number(tierPercents.jackpot || 0)) / 100
		);
		const jackpotEach =
			jackpotTickets > 0 ? round2(jackpotPool / jackpotTickets) : 0;
		return {
			revenue,
			prizePool,
			jackpotPool,
			otherPool,
			jackpotTickets,
			jackpotEach,
		};
	}, [
		totalCodes,
		costPerCode,
		giveawayPercentage,
		jackpotGiveawayPercentage,
		tierPercents.jackpot,
	]);

	const setTier = (key, raw) => {
		const v = raw === "" ? 0 : Number(raw);
		setTierPercents((prev) => ({ ...prev, [key]: Number.isFinite(v) ? v : 0 }));
	};

	const setWeight = (key, raw) => {
		const v = raw === "" ? 0 : Number(raw);
		setWeights((prev) => ({ ...prev, [key]: Number.isFinite(v) ? v : 0 }));
	};

	const normalizeTiersTo100 = () => {
		if (tierSum <= 0) {
			toast.error("Add some percentages first");
			return;
		}
		const factor = 100 / tierSum;
		const next = { ...tierPercents };
		for (const { key } of TIER_KEYS) {
			next[key] = round2(Number(tierPercents[key] || 0) * factor);
		}
		setTierPercents(next);
		toast.success("Scaled tier % to sum to 100");
	};

	const buildPayloadObjects = () => {
		const tierDistribution = {};
		for (const { key } of TIER_KEYS) {
			tierDistribution[key] = Number(tierPercents[key]) || 0;
		}
		const prizeTierWeights = {};
		for (const key of M_KEYS) {
			prizeTierWeights[key] = Number(weights[key]) || 0;
		}
		return { tierDistribution, prizeTierWeights };
	};

	const generateCode = async (e) => {
		e.preventDefault();
		if (isLoading) return;
		setIsLoading(true);

		if (!totalCodes || !costPerCode) {
			toast.error("Fill in total codes and cost per code");
			setIsLoading(false);
			return;
		}

		if (!tierSumOk) {
			toast.error(
				`Tier percentages must sum to 100% (currently ${tierSum}%). Adjust or use “Normalize to 100%”.`
			);
			setIsLoading(false);
			return;
		}

		const { tierDistribution, prizeTierWeights } = buildPayloadObjects();

		const body = {
			totalCodes: parseInt(totalCodes, 10),
			costPerCode: Number(costPerCode),
			giveawayPercentage: Number(giveawayPercentage),
			jackpotGiveawayPercentage: Number(jackpotGiveawayPercentage),
			tierDistribution,
			prizeTierWeights,
		};
		if (symbolSet.trim().length >= 8) {
			body.symbolSet = symbolSet.trim();
		}

		try {
			const { data } = await axios.post("/scratch-codes/generate", body);

			if (data.success) {
				const id = data.batchNumber ? ` ${data.batchNumber}` : "";
				const extra = data.jackpotPrizeEach != null
					? ` Jackpot: ${currency} ${data.jackpotPrizeEach} each (${data.tierCounts?.jackpot ?? 0} ticket(s)).`
					: "";
				toast.success(`Batch${id} created.${extra} Refreshing…`);
				setTotalCodes("");
				setCostPerCode("");
				setGiveawayPercentage("20");
				setJackpotGiveawayPercentage("15");
				setTierPercents({ ...DEFAULT_TIERS });
				setWeights({ ...DEFAULT_WEIGHTS });
				setSymbolSet("");
				onGenerationSuccess();
				setIsMenuOpen(false);
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			console.error(
				"Error generating codes:",
				error.response?.data || error.message
			);
			toast.error(
				error.response?.data?.message ||
					"An error occurred while generating codes."
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full max-w-4xl bg-white px-6 py-8 md:px-10 rounded-2xl shadow-sm border border-gray-100 mb-8">
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						Generate scratch batch
					</h2>
					<p className="mt-1 text-sm text-gray-600 max-w-xl">
						<strong>Prize pool</strong> = total revenue × giveaway
						%. <strong>Jackpot slice</strong> = pool × jackpot %.
						Remaining pool is split across <strong>m3–m8</strong>{" "}
						by relative weights.
					</p>
					<p className="mt-2 text-xs text-gray-500 max-w-xl font-mono bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
						Batch IDs are assigned automatically:{" "}
						<strong>PREFIX-yyyyMM-NNNN</strong> (e.g.{" "}
						<code className="text-orange-700">BAA-202612-0001</code>
						). Set <code>BATCH_ID_PREFIX</code> (2–4 chars, e.g.{" "}
						<code>LC</code> or <code>BAA</code>) and optional{" "}
						<code>BATCH_ID_TIMEZONE</code> (IANA, default{" "}
						<code>UTC</code>) on the server.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					className="shrink-0 self-center sm:self-start flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
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

			<form
				onSubmit={generateCode}
				className={`space-y-6 overflow-hidden transition-all duration-300 ${
					isMenuOpen ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				{preview && (
					<div className="rounded-xl bg-orange-50 border border-orange-100 p-4 md:p-5">
						<div className="flex items-center gap-2 text-orange-900 font-semibold text-sm mb-3">
							<Info className="w-4 h-4 shrink-0" />
							Preview (before generate)
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
							<div>
								<p className="text-gray-500">Total revenue</p>
								<p className="font-semibold text-gray-900">
									{currency} {preview.revenue.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Prize pool</p>
								<p className="font-semibold text-gray-900">
									{currency}{" "}
									{preview.prizePool.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Jackpot pool</p>
								<p className="font-semibold text-gray-900">
									{currency}{" "}
									{preview.jackpotPool.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Other tiers pool</p>
								<p className="font-semibold text-gray-900">
									{currency}{" "}
									{preview.otherPool.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Jackpot tickets (est.)</p>
								<p className="font-semibold text-gray-900">
									{preview.jackpotTickets}
								</p>
							</div>
							<div>
								<p className="text-gray-500">Jackpot each (est.)</p>
								<p className="font-semibold text-gray-900">
									{preview.jackpotTickets > 0
										? `${currency} ${preview.jackpotEach.toLocaleString()}`
										: "—"}
								</p>
							</div>
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
							placeholder="e.g. 10000"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
						/>
					</div>
					<div>
						<label
							htmlFor="costPerCode"
							className="block text-sm font-medium text-gray-700"
						>
							Cost per code ({currency})
						</label>
						<input
							id="costPerCode"
							value={costPerCode}
							onChange={(e) => setCostPerCode(e.target.value)}
							type="number"
							min={0}
							step="0.01"
							placeholder="e.g. 5"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
						/>
					</div>
					<div>
						<label
							htmlFor="giveawayPercentage"
							className="block text-sm font-medium text-gray-700"
						>
							Giveaway % of revenue
						</label>
						<select
							id="giveawayPercentage"
							value={giveawayPercentage}
							onChange={(e) =>
								setGiveawayPercentage(e.target.value)
							}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
						>
							{[
								0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80,
								90, 100,
							].map((val) => (
								<option key={val} value={val}>
									{val}%
								</option>
							))}
						</select>
					</div>
					<div className="sm:col-span-2">
						<label
							htmlFor="jackpotGiveawayPercentage"
							className="block text-sm font-medium text-gray-700"
						>
							Jackpot % of prize pool
						</label>
						<input
							id="jackpotGiveawayPercentage"
							value={jackpotGiveawayPercentage}
							onChange={(e) =>
								setJackpotGiveawayPercentage(e.target.value)
							}
							type="number"
							min={0}
							max={100}
							step="0.1"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
						/>
					</div>
				</div>

				<div>
					<div className="flex flex-wrap items-end justify-between gap-3 mb-3">
						<div>
							<h3 className="text-sm font-semibold text-gray-900">
								Ticket tier mix (% of all codes)
							</h3>
							<p className="text-xs text-gray-500 mt-0.5">
								Must sum to 100%. Use 0 for tiers you don’t use.
							</p>
						</div>
						<div className="flex items-center gap-3">
							<span
								className={`text-sm font-medium tabular-nums ${
									tierSumOk ? "text-green-700" : "text-red-600"
								}`}
							>
								Sum: {tierSum}%
							</span>
							<button
								type="button"
								onClick={normalizeTiersTo100}
								className="text-sm font-medium text-orange-700 hover:text-orange-800 underline"
							>
								Normalize to 100%
							</button>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{TIER_KEYS.map(({ key, label, hint }) => (
							<div
								key={key}
								className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/80"
							>
								<div className="flex-1 min-w-0">
									<label
										htmlFor={`tier-${key}`}
										className="block text-sm font-medium text-gray-800"
									>
										{label}
									</label>
									<p className="text-xs text-gray-500 truncate">
										{hint}
									</p>
								</div>
								<div className="w-24 shrink-0">
									<input
										id={`tier-${key}`}
										type="number"
										min={0}
										max={100}
										step="0.1"
										value={tierPercents[key] ?? 0}
										onChange={(e) => setTier(key, e.target.value)}
										className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-right text-sm"
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				<div>
					<h3 className="text-sm font-semibold text-gray-900 mb-1">
						Prize weights (m3–m8)
					</h3>
					<p className="text-xs text-gray-500 mb-3">
						Relative values only; actual {currency} amounts are scaled
						to fill the pool after jackpot. Set weight &gt; 0 for any
						tier you assign tickets to.
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
						{M_KEYS.map((key) => (
							<div key={key}>
								<label
									htmlFor={`w-${key}`}
									className="block text-xs font-medium text-gray-600 mb-1"
								>
									{key.toUpperCase()} weight
								</label>
								<input
									id={`w-${key}`}
									type="number"
									min={0}
									step="0.1"
									value={weights[key] ?? 0}
									onChange={(e) => setWeight(key, e.target.value)}
									className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
								/>
							</div>
						))}
					</div>
				</div>

				<div>
					<label
						htmlFor="symbolSet"
						className="block text-sm font-medium text-gray-700"
					>
						Symbol set (optional)
					</label>
					<p className="text-xs text-gray-500 mt-0.5 mb-1">
						At least 8 characters if set; otherwise A–Z is used.
					</p>
					<input
						id="symbolSet"
						value={symbolSet}
						onChange={(e) => setSymbolSet(e.target.value)}
						type="text"
						placeholder="Default: ABCDEFGHIJKLMNOPQRSTUVWXYZ"
						className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-mono text-sm"
					/>
				</div>

				<div className="flex justify-center pt-2">
					<button
						type="submit"
						disabled={isLoading || !tierSumOk}
						className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isLoading ? "Generating…" : "Generate batch"}
					</button>
				</div>
			</form>
		</div>
	);
};

export default GenerateCodeForm;
