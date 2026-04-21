import axios from "../../../lib/api";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
	Layers2,
	PlusCircle,
	QrCode,
	RefreshCw,
	Trash2,
} from "lucide-react";
import AdminPagination from "../../Components/admin/AdminPagination";
import { useAppcontext } from "../../context/AppContext";
import ConfirmDeleteByNameModal from "../../Components/admin/ConfirmDeleteByNameModal";
import GenerateBatchModal from "../../Components/admin/GenerateBatchModal";
import AdminHeader from "../../Components/admin/AdminHeader";

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
	const [totalAll, setTotalAll] = useState(-1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [period, setPeriod] = useState("all");
	const [sort, setSort] = useState("newest");
	const [generateModalOpen, setGenerateModalOpen] = useState(false);
	const [batchPendingDelete, setBatchPendingDelete] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [limit, setLimit] = useState(20);
	const [totalMatching, setTotalMatching] = useState(0);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
		return () => clearTimeout(t);
	}, [search]);

	const fetchBatches = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data } = await axios.get("/scratch-codes/batches", {
				params: {
					search: debouncedSearch || undefined,
					period,
					sort,
					page: currentPage,
					limit,
				},
			});
			if (data.success) {
				setBatches(data.data ?? []);
				setTotalAll(
					typeof data.totalAll === "number" ? data.totalAll : 0
				);
				setTotalMatching(data.totalMatching ?? 0);
				setTotalPages(data.totalPages ?? 1);
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
	}, [debouncedSearch, period, sort, currentPage, limit, setIsLoading]);

	const handleGenerationSuccess = useCallback(() => {
		setGenerateModalOpen(false);
		fetchBatches();
	}, [fetchBatches]);

	useEffect(() => {
		fetchBatches();
	}, [fetchBatches]);

	const fmtMoney = (n) =>
		`${currency} ${Number(n ?? 0).toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		})}`;

	const filtersActive = search.trim() !== "" || period !== "all" || sort !== "newest";

	const clearFilters = () => {
		setSearch("");
		setPeriod("all");
		setSort("newest");
	};

	return (
		<div className="w-full p-4 sm:p-6 lg:p-8">
			<ConfirmDeleteByNameModal
				isOpen={Boolean(batchPendingDelete)}
				onClose={() => setBatchPendingDelete(null)}
				title="Delete batch"
				description={
					batchPendingDelete ? (
						<>
							<p>This permanently deletes the batch and every scratch code in it.</p>
							<p className="mt-3 text-stone-700">Type this batch number exactly:</p>
							<p className="mt-1 rounded-md border border-amber-100 bg-stone-50 px-3 py-2 text-center font-mono text-sm font-semibold text-stone-900">
								{batchPendingDelete.batchNumber}
							</p>
						</>
					) : null
				}
				requiredExactText={batchPendingDelete?.batchNumber ?? ""}
				fieldLabel="Batch number"
				confirmButtonLabel="Delete batch"
				onDelete={async () => {
					if (!batchPendingDelete?._id) return false;
					try {
						const { data } = await axios.delete(`/scratch-codes/batches/${batchPendingDelete._id}`);
						if (data.success) {
							toast.success(data.message);
							await fetchBatches();
							return true;
						}
						return false;
					} catch (error) {
						toast.error(error.response?.data?.message || "Delete failed.");
						return false;
					}
				}}
			/>
			<GenerateBatchModal
				isOpen={generateModalOpen}
				onClose={() => setGenerateModalOpen(false)}
				onGenerationSuccess={handleGenerationSuccess}
			/>

			<div className="mx-auto flex w-full max-w-7xl flex-col">
				<AdminHeader 
					title="Batches"
					subtitle="Filter, sort, generate new ones, or open a batch in Codes to print and analyze."
					icon={Layers2}
					search={search}
					setSearch={setSearch}
					searchPlaceholder="Search batch ID..."
					showClear={filtersActive}
					onClear={clearFilters}
					actions={[
						{ label: "Generate Batch", icon: PlusCircle, onClick: () => setGenerateModalOpen(true), variant: 'dark' }
					]}
					filters={[
						{
							label: "Created",
							value: period,
							onChange: setPeriod,
							options: [
								{ value: "7d", label: "Last 7 Days" },
								{ value: "30d", label: "Last 30 Days" },
								{ value: "90d", label: "Last 90 Days" }
							]
						},
						{
							label: "Sort By",
							value: sort,
							onChange: (val) => { setSort(val); setCurrentPage(1); },
							options: [
								{ value: "newest", label: "Newest First" },
								{ value: "oldest", label: "Oldest First" },
								{ value: "codes_desc", label: "Most Codes" },
								{ value: "codes_asc", label: "Fewest Codes" },
								{ value: "price_desc", label: "Price (High)" },
								{ value: "price_asc", label: "Price (Low)" }
							]
						},
						{
							label: "Show",
							value: limit,
							onChange: (val) => { setLimit(Number(val)); setCurrentPage(1); },
							options: [
								{ value: 10, label: "10 per page" },
								{ value: 20, label: "20 per page" },
								{ value: 50, label: "50 per page" },
								{ value: 100, label: "100 per page" }
							]
						}
					]}
				/>

				{totalAll < 0 ? (
					<div className="py-20 text-center">
						<p className="text-sm text-stone-500 animate-pulse">Loading batches...</p>
					</div>
				) : totalAll === 0 ? (
					<div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/20 px-6 py-20 text-center">
						<p className="text-stone-600 font-medium">No batches yet. Generate your first one to get started.</p>
						<button
							onClick={() => setGenerateModalOpen(true)}
							className="mt-4 inline-flex items-center gap-2 rounded-md bg-amber-800 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-all"
						>
							<PlusCircle size={18} /> Generate First Batch
						</button>
					</div>
				) : (
					<div className="mt-4">
						<p className="mb-4 text-xs font-bold text-stone-400 uppercase tracking-widest">
							Showing {batches.length} of {totalMatching > 0 ? totalMatching : totalAll} batches
						</p>

						<div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm ring-1 ring-black/[0.03]">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm border-collapse">
									<thead>
										<tr className="bg-stone-50 border-b border-stone-200">
											<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500">Batch ID</th>
											<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500">Mechanic</th>
											<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500 text-right">Codes</th>
											<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500 text-right">Price / code</th>
											<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500 text-right">Giveaway %</th>
											<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500 text-right">Jackpot</th>
											<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500">Created</th>
											<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500 text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-stone-100">
										{batches.length === 0 ? (
											<tr>
												<td colSpan={8} className="py-12 text-center text-stone-400 italic">No matches found.</td>
											</tr>
										) : (
											batches.map((b) => (
												<tr key={b._id} className="transition-colors hover:bg-stone-50/50">
													<td className="px-6 py-4 font-mono text-xs font-bold text-stone-900">{b.batchNumber}</td>
													<td className="px-6 py-4 text-xs text-stone-500">
														{b.gameMode === "price_tag_v1" ? "Price Tag" : "Classic"}
													</td>
													<td className="px-6 py-4 text-right tabular-nums">
														<span className="font-bold">{formatCount(b.codesInserted)}</span>
														{b.totalCodes != null && Number(b.totalCodes) !== Number(b.codesInserted) && (
															<span className="ml-1.5 text-[10px] text-stone-400">/ {formatCount(b.totalCodes)}</span>
														)}
													</td>
													<td className="px-6 py-4 text-right tabular-nums font-semibold">{fmtMoney(b.costPerCode)}</td>
													<td className="px-6 py-4 text-right tabular-nums text-emerald-600 font-bold">{formatDecimal(b.giveawayPercentage)}%</td>
													<td className="px-6 py-4 text-right tabular-nums font-semibold">{fmtMoney(b.jackpotPrizeEach ?? b.winningPrize ?? 0)}</td>
													<td className="px-6 py-4 text-stone-500 text-xs">{formatDate(b.createdAt)}</td>
													<td className="px-6 py-4 text-right">
														<div className="flex items-center justify-end gap-2">
															<Link
																to={`/admin/codes?batch=${encodeURIComponent(b._id)}`}
																className="inline-flex items-center gap-1.5 rounded-md bg-amber-100/50 border border-amber-200 px-3 py-1.5 text-[11px] font-black uppercase tracking-tighter text-amber-900 hover:bg-amber-100 transition-colors"
															>
																<QrCode size={14} /> Codes
															</Link>
															<button
																type="button"
																onClick={() => setBatchPendingDelete(b)}
																className="inline-flex items-center gap-1.5 rounded-md border border-rose-100 bg-rose-50/50 px-3 py-1.5 text-[11px] font-black uppercase tracking-tighter text-rose-800 hover:bg-rose-100 transition-colors"
															>
																<Trash2 size={14} /> Delete
															</button>
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>

							{/* Pagination Controls */}
							<AdminPagination 
								currentPage={currentPage} 
								totalPages={totalPages} 
								setCurrentPage={setCurrentPage} 
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Batches;
