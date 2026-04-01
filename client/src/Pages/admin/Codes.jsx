import axios from "../../../lib/api";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import CodeCard from "../../Components/admin/CodeCard";
import {
	ChevronsLeft,
	ChevronsRight,
	PlusCircle,
	QrCode,
	Download,
} from "lucide-react";
import GenerateBatchModal from "../../Components/admin/GenerateBatchModal";
import ExportTicketsModal from "../../Components/admin/ExportTicketsModal";
import { useAppcontext } from "../../context/AppContext";
import AdminPageHeading from "../../Components/admin/AdminPageHeading";

const TIER_OPTIONS = [
	{ value: "all", label: "All tiers" },
	{ value: "loser", label: "Loser" },
	{ value: "cashback", label: "Cashback (stake back)" },
	{ value: "jackpot", label: "Jackpot" },
	{ value: "r1", label: "R1 (stake back)" },
	{ value: "r3", label: "R3" },
	{ value: "r5", label: "R5" },
	{ value: "r7", label: "R7" },
];

const selectClass =
	"w-full min-w-[10rem] px-3 py-2 border border-amber-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-300 bg-white text-stone-900 text-sm";

function svgStaticOrigin() {
	const api = axios.defaults.baseURL || "";
	return api.replace(/\/api\/?$/i, "") || "";
}

function formatCount(n) {
	const x = Number(n);
	if (!Number.isFinite(x)) return String(n);
	return Math.trunc(x).toLocaleString();
}

function formatDecimal(n, maxFractionDigits = 2) {
	const x = Number(n);
	if (!Number.isFinite(x)) return String(n);
	return x.toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: maxFractionDigits,
	});
}

const Codes = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [generateModalOpen, setGenerateModalOpen] = useState(false);
	const [exportModalOpen, setExportModalOpen] = useState(false);
	const [codes, setCodes] = useState([]);
	const [batches, setBatches] = useState([]);
	const [selectedBatchId, setSelectedBatchId] = useState("");
	const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);
	const [batchUsage, setBatchUsage] = useState(null);
	const [totalFiltered, setTotalFiltered] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [limit, setLimit] = useState(20);
	const [statusFilter, setStatusFilter] = useState("all");
	const [outcomeFilter, setOutcomeFilter] = useState("all");
	const [tierFilter, setTierFilter] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
	const [svgSymbolMap, setSvgSymbolMap] = useState(null);
	const [symbolPrizeMap, setSymbolPrizeMap] = useState(null);

	const { setIsLoading, currency } = useAppcontext();

	const svgOrigin = useMemo(() => svgStaticOrigin(), []);

	const tierBreakdownRows = useMemo(() => {
		if (!batchUsage?.tierBreakdown) return [];
		const prizes = batchUsage.tierPrizeAmounts || {};
		return Object.entries(batchUsage.tierBreakdown)
			.sort((a, b) => b[1] - a[1])
			.map(([tier, count]) => ({
				tier,
				count,
				prize: Number(prizes[tier] ?? 0),
				pct:
					batchUsage.totalCodes > 0
						? Math.round((count / batchUsage.totalCodes) * 1000) / 10
						: 0,
			}));
	}, [batchUsage]);

	const tierFilterOptions = useMemo(() => {
		const keys = Object.keys(batchUsage?.tierBreakdown || {}).filter(Boolean);
		const extras = keys
			.filter((k) => !TIER_OPTIONS.some((o) => o.value === k))
			.map((k) => ({ value: k, label: k }));
		return [...TIER_OPTIONS, ...extras];
	}, [batchUsage]);

	const fmt = useCallback(
		(n) =>
			`${currency} ${Number(n ?? 0).toLocaleString(undefined, {
				minimumFractionDigits: 0,
				maximumFractionDigits: 2,
			})}`,
		[currency]
	);

	const fetchCodesAndBatches = useCallback(
		async (isInitialLoad = false) => {
			setIsLoading(true);
			try {
				const { data } = await axios.get("/scratch-codes/get", {
					params: {
						...(isInitialLoad || !selectedBatchId
							? {}
							: { selectedBatch: selectedBatchId }),
						page: isInitialLoad ? 1 : currentPage,
						limit,
						...(statusFilter !== "all" && { status: statusFilter }),
						...(outcomeFilter !== "all" && {
							outcome: outcomeFilter,
						}),
						...(tierFilter !== "all" && { tier: tierFilter }),
						...(sortBy !== "newest" && { sort: sortBy }),
					},
				});

				if (data.success) {
					setCodes(data.data.withQRCodes);
					setTotalPages(data.data.totalPages);
					setCurrentPage(data.data.currentPage);
					setTotalFiltered(data.data.totalFiltered ?? 0);
					setBatchUsage(data.data.batchUsage ?? null);
					setSvgSymbolMap(data.data.svgSymbolMap ?? null);
					setSymbolPrizeMap(data.data.symbolPrizeMap ?? null);
					const fetchedBatches = data.data.batches;
					setBatches(fetchedBatches);

					if (isInitialLoad) {
						if (fetchedBatches.length === 0) {
							setSelectedBatchId("");
							setSelectedBatchDetails(null);
						} else {
							const batchParam = searchParams.get("batch");
							const fromParam =
								batchParam &&
								fetchedBatches.find(
									(b) => String(b._id) === String(batchParam)
								);
							if (fromParam) {
								setSelectedBatchId(String(fromParam._id));
								setSelectedBatchDetails(fromParam);
							} else {
								const first = fetchedBatches[0];
								setSelectedBatchId(String(first._id));
								setSelectedBatchDetails(first);
							}
						}
					} else {
						const details = fetchedBatches.find(
							(b) => String(b._id) === String(selectedBatchId)
						);
						setSelectedBatchDetails(details ?? null);
					}
				} else {
					toast.error(data.message);
				}
			} catch (error) {
				console.error(
					"Error fetching codes:",
					error.response?.data || error.message
				);
				toast.error(
					error.response?.data?.message ||
						"An error occurred while fetching codes."
				);
			} finally {
				setIsLoading(false);
			}
		},
		[
			setIsLoading,
			selectedBatchId,
			currentPage,
			limit,
			statusFilter,
			outcomeFilter,
			tierFilter,
			sortBy,
			searchParams,
		]
	);

	useEffect(() => {
		if (selectedBatchId || batches.length === 0) {
			fetchCodesAndBatches(batches.length === 0);
		}
	}, [selectedBatchId, batches.length, fetchCodesAndBatches]);

	const handleGenerationSuccess = () => {
		fetchCodesAndBatches(true);
		setGenerateModalOpen(false);
	};

	const handlePageChange = (newPage) => {
		if (newPage < 1 || newPage > totalPages) return;
		setCurrentPage(newPage);
	};

	const renderPagination = () => {
		const pageNumbers = [];
		const siblingCount = 1;
		const totalPageNumbersToShow = 7;

		if (totalPages <= totalPageNumbersToShow) {
			for (let i = 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
			const rightSiblingIndex = Math.min(
				currentPage + siblingCount,
				totalPages
			);

			const shouldShowLeftDots = leftSiblingIndex > 2;
			const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

			pageNumbers.push(1);

			if (shouldShowLeftDots) {
				pageNumbers.push("...");
			}

			for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
				if (i > 1 && i < totalPages) {
					pageNumbers.push(i);
				}
			}

			if (shouldShowRightDots) {
				pageNumbers.push("...");
			}

			pageNumbers.push(totalPages);
		}

		return [...new Set(pageNumbers)];
	};

	const redemptionPct = batchUsage?.redemptionRate ?? 0;

	return (
		<div className="w-full">
			<GenerateBatchModal
				isOpen={generateModalOpen}
				onClose={() => setGenerateModalOpen(false)}
				onGenerationSuccess={handleGenerationSuccess}
			/>
			<ExportTicketsModal
				isOpen={exportModalOpen}
				onClose={() => setExportModalOpen(false)}
				batchId={selectedBatchId}
				batchNumber={selectedBatchDetails?.batchNumber}
			/>
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto flex flex-col items-stretch">
				{batches && batches.length > 0 ? (
					<div className="w-full">
						<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="text-center sm:text-left">
								<AdminPageHeading icon={QrCode}>
									Scratch codes
								</AdminPageHeading>
								<p className="mt-1 text-sm text-stone-600">
									Batch analysis, usage, filters, and printable
									codes.
								</p>
							</div>
							<div className="flex flex-wrap justify-center gap-2 sm:justify-end">
								<button
									type="button"
									onClick={() => setExportModalOpen(true)}
									disabled={!selectedBatchId}
									className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Download className="h-5 w-5" strokeWidth={2} />
									Export
								</button>
								<button
									type="button"
									onClick={() => setGenerateModalOpen(true)}
									className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-amber-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
								>
									<PlusCircle className="h-5 w-5" strokeWidth={2} />
									Generate batch
								</button>
							</div>
						</div>

						<div className="mb-4 flex flex-wrap items-end justify-center gap-3 sm:justify-start">
							<div>
								<label
									htmlFor="batch-select"
									className="mb-1 block text-center text-xs font-semibold uppercase tracking-wide text-stone-500 sm:text-left"
								>
									Batch
								</label>
								<select
									id="batch-select"
									value={selectedBatchId}
									onChange={(e) => {
										const id = e.target.value;
										setSelectedBatchId(id);
										setCurrentPage(1);
										const next = new URLSearchParams(searchParams);
										if (id) next.set("batch", id);
										else next.delete("batch");
										setSearchParams(next, { replace: true });
									}}
									className={`${selectClass} min-w-[12rem] max-w-xs`}
								>
									{batches.map((batch) => (
										<option key={batch._id} value={batch._id}>
											{batch.batchNumber}
										</option>
									))}
								</select>
							</div>
							<div>
								<label
									htmlFor="status-filter"
									className="mb-1 block text-center text-xs font-semibold uppercase tracking-wide text-stone-500 sm:text-left"
								>
									Status
								</label>
								<select
									id="status-filter"
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}
									className={selectClass}
								>
									<option value="all">All</option>
									<option value="available">Available</option>
									<option value="redeemed">Redeemed</option>
								</select>
							</div>
							<div>
								<label
									htmlFor="outcome-filter"
									className="mb-1 block text-center text-xs font-semibold uppercase tracking-wide text-stone-500 sm:text-left"
								>
									Outcome
								</label>
								<select
									id="outcome-filter"
									value={outcomeFilter}
									onChange={(e) => {
										setOutcomeFilter(e.target.value);
										setCurrentPage(1);
									}}
									className={selectClass}
								>
									<option value="all">All</option>
									<option value="winner">Winner</option>
									<option value="loser">Loser</option>
									<option value="cashback">Cashback</option>
								</select>
							</div>
							<div>
								<label
									htmlFor="tier-filter"
									className="mb-1 block text-center text-xs font-semibold uppercase tracking-wide text-stone-500 sm:text-left"
								>
									Tier
								</label>
								<select
									id="tier-filter"
									value={tierFilter}
									onChange={(e) => {
										setTierFilter(e.target.value);
										setCurrentPage(1);
									}}
									className={selectClass}
								>
									{tierFilterOptions.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label
									htmlFor="sort-select"
									className="mb-1 block text-center text-xs font-semibold uppercase tracking-wide text-stone-500 sm:text-left"
								>
									Sort
								</label>
								<select
									id="sort-select"
									value={sortBy}
									onChange={(e) => {
										setSortBy(e.target.value);
										setCurrentPage(1);
									}}
									className={selectClass}
								>
									<option value="newest">Newest first</option>
									<option value="oldest">Oldest first</option>
									<option value="redeemed_newest">
										Redeemed (recent)
									</option>
								</select>
							</div>
							<div>
								<label
									htmlFor="limit-select"
									className="mb-1 block text-center text-xs font-semibold uppercase tracking-wide text-stone-500 sm:text-left"
								>
									Per page
								</label>
								<select
									id="limit-select"
									value={limit}
									onChange={(e) => {
										setLimit(Number(e.target.value));
										setCurrentPage(1);
									}}
									className={selectClass}
								>
									<option value="10">10</option>
									<option value="20">20</option>
									<option value="50">50</option>
									<option value="100">100</option>
								</select>
							</div>
						</div>

						{selectedBatchDetails && batchUsage && (
							<div className="mb-8 overflow-hidden rounded-md border border-amber-100 bg-white shadow-sm">
								<div className="border-b border-amber-100 bg-stone-50/80 px-4 py-3">
									<h2 className="text-base font-bold text-stone-900">
										Batch analysis —{" "}
										{selectedBatchDetails.batchNumber}
									</h2>
									<p className="mt-0.5 text-xs text-stone-500">
										Usage is for the whole batch; the grid
										uses your filters.
									</p>
								</div>
								<div className="grid gap-0 lg:grid-cols-2">
									<div className="border-b border-amber-100 p-4 sm:p-5 lg:border-b-0 lg:border-r">
										<h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
											Economics (batch setup)
										</h3>
										<dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
											<div className="flex justify-between gap-2 border-b border-stone-100 pb-2">
												<dt className="text-stone-500">
													Total codes
												</dt>
												<dd className="font-semibold tabular-nums text-stone-900">
													{formatCount(
														selectedBatchDetails.totalCodes
													)}
												</dd>
											</div>
											<div className="flex justify-between gap-2 border-b border-stone-100 pb-2">
												<dt className="text-stone-500">
													Cost / code
												</dt>
												<dd className="font-semibold tabular-nums text-stone-900">
													{fmt(
														selectedBatchDetails.costPerCode
													)}
												</dd>
											</div>
											<div className="flex justify-between gap-2 border-b border-stone-100 pb-2">
												<dt className="text-stone-500">
													Jackpot (each)
												</dt>
												<dd className="font-semibold tabular-nums text-stone-900">
													{fmt(
														selectedBatchDetails.jackpotPrizeEach ??
															selectedBatchDetails.winningPrize ??
															0
													)}
												</dd>
											</div>
											<div className="flex justify-between gap-2 border-b border-stone-100 pb-2">
												<dt className="text-stone-500">
													Total revenue
												</dt>
												<dd className="font-semibold tabular-nums text-stone-900">
													{fmt(
														selectedBatchDetails.totalRevenue
													)}
												</dd>
											</div>
											<div className="flex justify-between gap-2 border-b border-stone-100 pb-2">
												<dt className="text-stone-500">
													Giveaway %
												</dt>
												<dd className="font-semibold tabular-nums text-stone-900">
													{formatDecimal(
														selectedBatchDetails.giveawayPercentage
													)}
													%
												</dd>
											</div>
											<div className="flex justify-between gap-2 border-b border-stone-100 pb-2">
												<dt className="text-stone-500">
													Jackpot % of pool
												</dt>
												<dd className="font-semibold tabular-nums text-stone-900">
													{formatDecimal(
														selectedBatchDetails.jackpotGiveawayPercentage ??
															0
													)}
													%
												</dd>
											</div>
											<div className="flex justify-between gap-2 pb-1">
												<dt className="text-stone-500">
													Margin retained (pool)
												</dt>
												<dd className="font-semibold tabular-nums text-stone-900">
													{fmt(
														selectedBatchDetails.marginRetainedFromPrizePool ??
															0
													)}
												</dd>
											</div>
										</dl>
									</div>
									<div className="p-4 sm:p-5">
										<h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
											Usage & outcomes
										</h3>
										<div className="space-y-4">
											<div>
												<div className="mb-1 flex justify-between text-sm">
													<span className="text-stone-600">
														Redemption
													</span>
													<span className="font-semibold tabular-nums text-stone-900">
														{formatCount(batchUsage.redeemedCount)} /{" "}
														{formatCount(batchUsage.totalCodes)} (
														{formatDecimal(redemptionPct)}%)
													</span>
												</div>
												<div className="h-2 w-full overflow-hidden rounded-sm bg-stone-200">
													<div
														className="h-full bg-amber-700 transition-[width]"
														style={{
															width: `${Math.min(
																100,
																redemptionPct
															)}%`,
														}}
													/>
												</div>
												<p className="mt-1 text-xs text-stone-500 tabular-nums">
													Available:{" "}
													{formatCount(batchUsage.availableCount)}
												</p>
											</div>
											<dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
												<div className="flex justify-between gap-2 rounded-sm border border-stone-100 bg-stone-50/60 px-3 py-2">
													<dt className="text-stone-600">
														Winners (in batch)
													</dt>
													<dd className="font-semibold tabular-nums">
														{formatCount(batchUsage.winnersInBatch)}
													</dd>
												</div>
												<div className="flex justify-between gap-2 rounded-sm border border-stone-100 bg-stone-50/60 px-3 py-2">
													<dt className="text-stone-600">
														Winners redeemed
													</dt>
													<dd className="font-semibold tabular-nums">
														{formatCount(batchUsage.winnersRedeemed)}
													</dd>
												</div>
												<div className="flex justify-between gap-2 rounded-sm border border-stone-100 bg-stone-50/60 px-3 py-2 sm:col-span-2">
													<dt className="text-stone-600">
														Losers redeemed
													</dt>
													<dd className="font-semibold tabular-nums">
														{formatCount(batchUsage.losersRedeemed)}
													</dd>
												</div>
											</dl>
											<div>
												<h4 className="mb-2 text-xs font-semibold text-stone-500">
													Tier composition & prizes
												</h4>
												{tierBreakdownRows.length === 0 ? (
													<p className="text-sm text-stone-500">
														No tier data.
													</p>
												) : (
													<ul className="space-y-2">
														{tierBreakdownRows.map(
															({
																tier,
																count,
																pct,
																prize,
															}) => (
																<li key={tier}>
																	<div className="mb-0.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs">
																		<span className="font-medium uppercase text-stone-700">
																			{tier}
																		</span>
																		<span className="text-right tabular-nums text-stone-600">
																			{formatCount(count)} tickets (
																			{formatDecimal(pct)}%)
																			<span className="mx-1.5 text-stone-300">
																				·
																			</span>
																			<span
																				className={
																					prize > 0
																						? "font-semibold text-stone-900"
																						: "text-stone-500"
																				}
																			>
																				{prize > 0
																					? `${fmt(prize)} each`
																					: "No prize"}
																			</span>
																		</span>
																	</div>
																	<div className="h-1.5 w-full overflow-hidden rounded-sm bg-stone-200">
																		<div
																			className="h-full bg-stone-500"
																			style={{
																				width: `${pct}%`,
																			}}
																		/>
																	</div>
																</li>
															)
														)}
													</ul>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{totalFiltered > 0 && (
							<p className="mb-3 text-center text-sm text-stone-600 sm:text-left tabular-nums">
								Showing{" "}
								{formatCount((currentPage - 1) * limit + 1)}–
								{formatCount(
									Math.min(currentPage * limit, totalFiltered)
								)}{" "}
								of {formatCount(totalFiltered)} matching codes
							</p>
						)}

						<div className="flex flex-col">
							{codes && codes.length > 0 ? (
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
									{codes.map((code) => (
										<CodeCard
											key={code._id}
											code={code}
											symbolSvgMap={svgSymbolMap}
											svgStaticOrigin={svgOrigin}
											symbolPrizeMap={symbolPrizeMap}
										/>
									))}
								</div>
							) : (
								<div className="rounded-md border border-dashed border-amber-200 bg-amber-50/40 px-4 py-12 text-center">
									<p className="text-stone-600">
										{totalFiltered === 0
											? "No codes match the current filters."
											: "No codes on this page."}
									</p>
								</div>
							)}
						</div>

						{totalPages > 1 && (
							<div className="mt-8 flex flex-wrap items-center justify-center gap-2">
								<button
									type="button"
									onClick={() =>
										handlePageChange(currentPage - 1)
									}
									disabled={currentPage === 1}
									className="rounded-md border border-amber-100 bg-white px-3 py-2 text-stone-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-45"
								>
									<ChevronsLeft className="h-5 w-5" />
								</button>
								{renderPagination().map((page, index) =>
									typeof page === "number" ? (
										<button
											type="button"
											key={index}
											onClick={() =>
												handlePageChange(page)
											}
											className={`h-10 min-w-[2.5rem] rounded-md px-2 text-sm font-medium transition-colors ${
												currentPage === page
													? "bg-amber-800 text-white shadow-sm"
													: "border border-amber-100 bg-white text-stone-700 hover:bg-amber-50"
											}`}
										>
											{page}
										</button>
									) : (
										<span
											key={index}
											className="px-2 text-stone-400"
										>
											…
										</span>
									)
								)}
								<button
									type="button"
									onClick={() =>
										handlePageChange(currentPage + 1)
									}
									disabled={currentPage === totalPages}
									className="rounded-md border border-amber-100 bg-white px-3 py-2 text-stone-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-45"
								>
									<ChevronsRight className="h-5 w-5" />
								</button>
							</div>
						)}
					</div>
				) : (
					<div className="mx-auto mt-4 w-full max-w-5xl rounded-md border border-amber-100 bg-white px-6 py-12 text-center shadow-sm">
						<h2 className="mb-2 text-xl font-bold text-stone-900">
							No batches yet
						</h2>
						<p className="mb-6 text-sm text-stone-600 sm:text-base">
							Create your first batch of scratch codes to get started.
						</p>
						<button
							type="button"
							onClick={() => setGenerateModalOpen(true)}
							className="inline-flex items-center gap-2 rounded-md bg-amber-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
						>
							<PlusCircle className="h-5 w-5" strokeWidth={2} />
							Generate batch
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Codes;
