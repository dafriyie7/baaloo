import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../../lib/api";
import AdminHeader from "../../Components/admin/AdminHeader";
import { useAppcontext } from "../../context/AppContext";
import { Receipt, Search, Filter, ArrowRight, Download, Calendar, ExternalLink, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import AdminPagination from "../../Components/admin/AdminPagination";
import StatBadge from "../../Components/admin/StatBadge";

const Transactions = () => {
	const [transactions, setTransactions] = useState([]);
	const [total, setTotal] = useState(0);
	const [stats, setStats] = useState(null);
	const { setIsLoading, currency } = useAppcontext();

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [limit, setLimit] = useState(20);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
		return () => clearTimeout(t);
	}, [search]);

	const fetchTransactions = useCallback(async () => {
		setIsLoading(true);
		try {
			const params = { page: currentPage, limit };
			if (debouncedSearch) params.search = debouncedSearch;
			if (statusFilter !== "all") params.status = statusFilter;

			const { data } = await axiosInstance.get("/transactions/get", { params });

			if (data.success) {
				setTransactions(data.data.transactions);
				setTotal(data.data.total);
				setTotalPages(data.data.pages);
			}
		} catch (error) {
			toast.error("Failed to fetch transactions.");
		} finally {
			setIsLoading(false);
		}
	}, [debouncedSearch, statusFilter, currentPage, limit, setIsLoading]);

	const fetchStats = useCallback(async () => {
		try {
			const { data } = await axiosInstance.get("/transactions/stats");
			if (data.success) {
				setStats(data.stats);
			}
		} catch (error) {
			console.error("Failed to fetch transaction stats.");
		}
	}, []);

	useEffect(() => {
		fetchTransactions();
	}, [fetchTransactions]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	const clearFilters = () => {
		setSearch("");
		setStatusFilter("all");
		setCurrentPage(1);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "completed": return "text-emerald-600 bg-emerald-50 border-emerald-100";
			case "pending": return "text-amber-600 bg-amber-50 border-amber-100";
			case "failed": return "text-red-600 bg-red-50 border-red-100";
			case "cancelled": return "text-stone-500 bg-stone-50 border-stone-100";
			default: return "text-stone-400 bg-stone-50 border-stone-50";
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "completed": return <CheckCircle2 size={12} />;
			case "pending": return <Clock size={12} />;
			case "failed": return <XCircle size={12} />;
			case "cancelled": return <AlertCircle size={12} />;
			default: return null;
		}
	};

	return (
		<div className="w-full min-h-screen">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
				<AdminHeader 
					title="Payout Transactions"
					subtitle="Track and monitor all mobile money disbursements and their gateway statuses."
					icon={Receipt}
					search={search}
					setSearch={setSearch}
					searchPlaceholder="Search by phone, name or ID..."
					showClear={search || statusFilter !== "all"}
					onClear={clearFilters}
					filters={[
						{
							label: "Status",
							value: statusFilter,
							onChange: setStatusFilter,
							options: [
								{ value: "all", label: "All Statuses" },
								{ value: "completed", label: "Completed" },
								{ value: "pending", label: "Pending" },
								{ value: "failed", label: "Failed" },
								{ value: "cancelled", label: "Cancelled" }
							]
						},
						{
							label: "Show",
							value: limit,
							onChange: (val) => { setLimit(Number(val)); setCurrentPage(1); },
							options: [
								{ value: 10, label: "10 per page" },
								{ value: 20, label: "20 per page" },
								{ value: 50, label: "50 per page" }
							]
						}
					]}
				/>

				{/* Quick Stats Overview */}
				<div className="mb-6 flex flex-wrap items-center justify-start gap-4">
					<StatBadge 
						label="Total Payouts" 
						value={stats?.totalPayouts || 0} 
					/>
					<StatBadge 
						label="Paid" 
						value={`${currency} ${Number(stats?.completedAmount || 0).toLocaleString()}`} 
						color="border-emerald-100 bg-emerald-50/30" 
						labelColor="text-emerald-600/60" 
						valueColor="text-emerald-600" 
					/>
					<StatBadge 
						label="Pending" 
						value={`${currency} ${Number(stats?.pendingAmount || 0).toLocaleString()}`} 
						color="border-amber-100 bg-amber-50/30" 
						labelColor="text-amber-600/60" 
						valueColor="text-amber-600" 
					/>
				</div>

				<div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-stone-50/50 border-b border-stone-100">
									<th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Transaction Details</th>
									<th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Player</th>
									<th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Amount</th>
									<th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Ticket & Batch</th>
									<th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Status</th>
									<th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 text-right">Initiated At</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{transactions.length > 0 ? (
									transactions.map((t) => (
										<tr key={t._id} className="group hover:bg-stone-50/30 transition-colors">
											<td className="px-6 py-5">
												<div className="flex flex-col">
													<p className="text-[11px] font-mono font-bold text-stone-800 tabular-nums">ID: {t.gatewayTransactionId || t._id.slice(-8).toUpperCase()}</p>
													<p className="text-[10px] font-bold text-stone-400 mt-0.5">{t.phone}</p>
												</div>
											</td>
											<td className="px-6 py-5">
												<div className="flex flex-col">
													<p className="text-xs font-bold text-stone-900">{t.player?.name || "Unknown"}</p>
													<p className="text-[10px] text-stone-400">{t.player?.phone || t.phone}</p>
												</div>
											</td>
											<td className="px-6 py-5">
												<p className="text-sm font-black text-stone-900 tabular-nums">{currency} {Number(t.amount).toLocaleString()}</p>
											</td>
											<td className="px-6 py-5">
												<div className="flex flex-col">
													<p className="text-[10px] font-black text-stone-600 uppercase tracking-tighter">
														Batch {t.scratchCode?.batchNumber?.batchNumber || "-"}
													</p>
													<p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
														Tier {t.scratchCode?.tier || "-"}
													</p>
												</div>
											</td>
											<td className="px-6 py-5">
												<div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusColor(t.status)}`}>
													{getStatusIcon(t.status)}
													{t.status}
												</div>
											</td>
											<td className="px-6 py-5 text-right">
												<p className="text-[11px] font-bold text-stone-800 tabular-nums">{new Date(t.createdAt).toLocaleDateString()}</p>
												<p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
													{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</p>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={6} className="px-6 py-20 text-center">
											<div className="flex flex-col items-center justify-center opacity-30">
												<Receipt className="h-12 w-12 mb-4 text-stone-300" />
												<p className="text-lg font-bold text-stone-500">No transactions recorded yet</p>
											</div>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<AdminPagination 
						currentPage={currentPage} 
						totalPages={totalPages} 
						setCurrentPage={setCurrentPage} 
					/>
				</div>
			</div>
		</div>
	);
};

export default Transactions;
