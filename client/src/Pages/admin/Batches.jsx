import axios from "../../../lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Layers2, QrCode, RefreshCw, Search, X } from "lucide-react";
import { useAppcontext } from "../../context/AppContext";
import AdminPageHeading from "../../Components/admin/AdminPageHeading";

const selectClass =
	"w-full min-w-[10rem] px-3 py-2 border border-amber-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-300 bg-white text-stone-900 text-sm";

const inputClass =
	"w-full min-w-[12rem] flex-1 px-3 py-2 border border-amber-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-300 bg-white text-stone-900 text-sm placeholder:text-stone-400";

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

function formatDate(iso) {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return "—";
	}
}

const Batches = () => {
	const { setIsLoading, currency } = useAppcontext();
	const [batches, setBatches] = useState([]);
	const [search, setSearch] = useState("");
	const [period, setPeriod] = useState("all");
	const [sort, setSort] = useState("newest");

	const fetchBatches = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data } = await axios.get("/scratch-codes/batches");
			if (data.success) {
				setBatches(data.data ?? []);
			} else {
				toast.error(data.message || "Could not load batches.");
			}
		} catch (error) {
			console.error(error);
			toast.error(
				error.response?.data?.message || "Could not load batches."
			);
		} finally {
			setIsLoading(false);
		}
	}, [setIsLoading]);

	useEffect(() => {
		fetchBatches();
	}, [fetchBatches]);

	const fmtMoney = (n) =>
		`${currency} ${Number(n ?? 0).toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		})}`;

	const searchTrim = search.trim().toLowerCase();

	const filteredBatches = useMemo(() => {
		let list = [...batches];
		if (searchTrim) {
			list = list.filter((b) =>
				(String(b.batchNumber ?? "")).toLowerCase().includes(searchTrim)
			);
		}
		if (period !== "all") {
			const days =
				period === "7d" ? 7 : period === "30d" ? 30 : 90;
			const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
			list = list.filter(
				(b) => new Date(b.createdAt).getTime() >= cutoff
			);
		}
		list.sort((a, b) => {
			const ca = Number(a.codesInserted ?? 0);
			const cb = Number(b.codesInserted ?? 0);
			const pa = Number(a.costPerCode ?? 0);
			const pb = Number(b.costPerCode ?? 0);
			const ta = new Date(a.createdAt).getTime();
			const tb = new Date(b.createdAt).getTime();
			switch (sort) {
				case "oldest":
					return ta - tb;
				case "codes_desc":
					return cb - ca;
				case "codes_asc":
					return ca - cb;
				case "price_desc":
					return pb - pa;
				case "price_asc":
					return pa - pb;
				default:
					return tb - ta;
			}
		});
		return list;
	}, [batches, searchTrim, period, sort]);

	const filtersActive = searchTrim !== "" || period !== "all" || sort !== "newest";

	const clearFilters = () => {
		setSearch("");
		setPeriod("all");
		setSort("newest");
	};

	return (
		<div className="w-full p-4 sm:p-6 lg:p-8">
			<div className="mx-auto flex w-full max-w-6xl flex-col">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="text-center sm:text-left">
						<AdminPageHeading icon={Layers2}>
							Batches
						</AdminPageHeading>
						<p className="mt-1 text-sm text-stone-600">
							All scratch batches. Filter, sort, then open a batch in
							Codes to print and analyze.
						</p>
					</div>
					<button
						type="button"
						onClick={() => fetchBatches()}
						className="inline-flex shrink-0 items-center justify-center gap-2 self-center rounded-md border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-50 sm:self-auto"
					>
						<RefreshCw className="h-4 w-4" strokeWidth={2} />
						Refresh
					</button>
				</div>

				{batches.length === 0 ? (
					<div className="rounded-md border border-dashed border-amber-200 bg-amber-50/40 px-6 py-14 text-center">
						<p className="text-stone-600">
							No batches yet. Generate one from the Codes page.
						</p>
						<Link
							to="/admin/codes"
							className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-900 underline-offset-2 hover:underline"
						>
							<QrCode className="h-4 w-4" strokeWidth={2} />
							Go to Codes
						</Link>
					</div>
				) : (
					<>
						<div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-100/90 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
							<label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-left">
								<span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
									Search batch ID
								</span>
								<span className="relative block">
									<Search
										className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
										strokeWidth={2}
										aria-hidden
									/>
									<input
										type="search"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder="e.g. AA-2603-010"
										className={`${inputClass} pl-9 font-mono text-sm`}
									/>
								</span>
							</label>
							<label className="flex min-w-[10rem] flex-col gap-1 text-left sm:max-w-[12rem]">
								<span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
									Created
								</span>
								<select
									value={period}
									onChange={(e) => setPeriod(e.target.value)}
									className={selectClass}
								>
									<option value="all">All time</option>
									<option value="7d">Last 7 days</option>
									<option value="30d">Last 30 days</option>
									<option value="90d">Last 90 days</option>
								</select>
							</label>
							<label className="flex min-w-[10rem] flex-col gap-1 text-left sm:max-w-[14rem]">
								<span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
									Sort by
								</span>
								<select
									value={sort}
									onChange={(e) => setSort(e.target.value)}
									className={selectClass}
								>
									<option value="newest">Newest first</option>
									<option value="oldest">Oldest first</option>
									<option value="codes_desc">Most codes</option>
									<option value="codes_asc">Fewest codes</option>
									<option value="price_desc">Price / code (high)</option>
									<option value="price_asc">Price / code (low)</option>
								</select>
							</label>
							{filtersActive ? (
								<button
									type="button"
									onClick={clearFilters}
									className="inline-flex items-center justify-center gap-1.5 self-stretch rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 lg:self-auto lg:shrink-0"
								>
									<X className="h-4 w-4" strokeWidth={2} />
									Reset
								</button>
							) : null}
						</div>
						<p className="mb-3 text-center text-xs text-stone-500 sm:text-left">
							Showing{" "}
							<span className="font-semibold text-stone-700">
								{filteredBatches.length}
							</span>{" "}
							of {batches.length} batches
						</p>

						{filteredBatches.length === 0 ? (
							<div className="rounded-md border border-dashed border-amber-200 bg-amber-50/40 px-6 py-12 text-center text-stone-600">
								<p>No batches match these filters.</p>
								<button
									type="button"
									onClick={clearFilters}
									className="mt-3 text-sm font-semibold text-amber-900 underline-offset-2 hover:underline"
								>
									Reset filters
								</button>
							</div>
						) : (
							<div className="overflow-hidden rounded-md border border-amber-100 bg-white shadow-sm">
								<div className="overflow-x-auto">
									<table className="w-full min-w-[640px] text-left text-sm">
										<thead>
											<tr className="border-b border-amber-100 bg-stone-50/90 text-xs font-semibold uppercase tracking-wide text-stone-500">
												<th className="px-4 py-3">Batch ID</th>
												<th className="px-4 py-3 text-right tabular-nums">
													Codes
												</th>
												<th className="px-4 py-3 text-right tabular-nums">
													Price / code
												</th>
												<th className="px-4 py-3 text-right tabular-nums">
													Giveaway %
												</th>
												<th className="px-4 py-3 text-right tabular-nums">
													Jackpot each
												</th>
												<th className="px-4 py-3">Created</th>
												<th className="px-4 py-3 text-right">
													Actions
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-stone-100">
											{filteredBatches.map((b) => (
												<tr
													key={b._id}
													className="text-stone-800 transition-colors hover:bg-amber-50/40"
												>
													<td className="px-4 py-3 font-mono text-xs font-semibold text-stone-900 sm:text-sm">
														{b.batchNumber}
													</td>
													<td className="px-4 py-3 text-right tabular-nums">
														<span className="font-medium">
															{formatCount(b.codesInserted)}
														</span>
														{b.totalCodes != null &&
														Number(b.totalCodes) !==
															Number(b.codesInserted) ? (
															<span className="ml-1 text-xs text-stone-400">
																/ {formatCount(b.totalCodes)}{" "}
																planned
															</span>
														) : null}
													</td>
													<td className="px-4 py-3 text-right tabular-nums">
														{fmtMoney(b.costPerCode)}
													</td>
													<td className="px-4 py-3 text-right tabular-nums">
														{formatDecimal(b.giveawayPercentage)}%
													</td>
													<td className="px-4 py-3 text-right tabular-nums">
														{fmtMoney(
															b.jackpotPrizeEach ??
																b.winningPrize ??
																0
														)}
													</td>
													<td className="px-4 py-3 text-stone-600">
														{formatDate(b.createdAt)}
													</td>
													<td className="px-4 py-3 text-right">
														<Link
															to={`/admin/codes?batch=${encodeURIComponent(b._id)}`}
															className="inline-flex items-center gap-1 rounded-md bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
														>
															<QrCode className="h-3.5 w-3.5" />
															Codes
														</Link>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default Batches;
