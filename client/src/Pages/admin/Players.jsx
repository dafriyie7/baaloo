import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../../lib/api";
import AdminHeader from "../../Components/admin/AdminHeader";
import { useAppcontext } from "../../context/AppContext";
import { Users, Phone } from "lucide-react";
import AdminPagination from "../../Components/admin/AdminPagination";
import StatBadge from "../../Components/admin/StatBadge";

const Players = () => {
	const [players, setPlayers] = useState([]);
	const [batchOptions, setBatchOptions] = useState([]);
	const [totalPlayers, setTotalPlayers] = useState(0);
	const [winnerCount, setWinnerCount] = useState(0);
	const [loserCount, setLoserCount] = useState(0);
	const { setIsLoading, currency } = useAppcontext();

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [batchFilter, setBatchFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [limit, setLimit] = useState(20);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
		return () => clearTimeout(t);
	}, [search]);

	const fetchPlayers = useCallback(async () => {
		setIsLoading(true);
		try {
			const params = { page: currentPage, limit };
			if (debouncedSearch) params.search = debouncedSearch;
			if (statusFilter !== "all") params.outcome = statusFilter;
			if (batchFilter !== "all") params.batch = batchFilter;

			const { data } = await axiosInstance.get("/players/get", { params });

			if (data.success) {
				const d = data.data;
				setPlayers(d.players ?? []);
				setBatchOptions(d.batchOptions ?? []);
				setTotalPlayers(d.totalPlayers ?? 0);
				setWinnerCount(d.winnersCount ?? 0);
				setLoserCount(d.losersCount ?? 0);
				setTotalPages(d.totalPages ?? 1);
			}
		} catch (error) {
			toast.error("Failed to fetch players list.");
		} finally {
			setIsLoading(false);
		}
	}, [debouncedSearch, statusFilter, batchFilter, currentPage, limit, setIsLoading]);

	useEffect(() => {
		fetchPlayers();
	}, [fetchPlayers]);

	const clearFilters = () => {
		setSearch("");
		setStatusFilter("all");
		setBatchFilter("all");
		setCurrentPage(1);
	};

	const claimPayout = async (id) => {
		if (!window.confirm("Mark this payout as paid?")) return;
		try {
			setIsLoading(true);
			const { data } = await axiosInstance.post(`/players/claim/${id}`);
			if (data.success) {
				toast.success("Payout marked as paid!");
				fetchPlayers();
			} else {
				toast.error(data.message || "Failed to mark as paid.");
			}
		} catch (error) {
			toast.error("An error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full min-h-screen">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
				<AdminHeader 
					title="Scans"
					subtitle="Monitor all recent game activity and redemption lifecycles."
					icon={Users}
					search={search}
					setSearch={setSearch}
					searchPlaceholder="Search by name or phone..."
					showClear={search || statusFilter !== "all" || batchFilter !== "all"}
					onClear={clearFilters}
					filters={[
						{
							label: "Outcome",
							value: statusFilter,
							onChange: setStatusFilter,
							options: [
								{ value: "winner", label: "Winners" },
								{ value: "loser", label: "Losers" }
							]
						},
						{
							label: "Batch",
							value: batchFilter,
							onChange: (val) => { setBatchFilter(val); setCurrentPage(1); },
							options: batchOptions.map(b => ({ value: b.id, label: b.label }))
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

				<div className="mb-6 flex flex-wrap items-center justify-start gap-4">
					<StatBadge label="Total Scans" value={totalPlayers} />
					<StatBadge 
						label="Total Wins" 
						value={winnerCount} 
						color="border-emerald-100 bg-emerald-50/30" 
						labelColor="text-emerald-600/60" 
						valueColor="text-emerald-600" 
					/>
					<StatBadge 
						label="Total Losses" 
						value={loserCount} 
						color="border-stone-100 bg-stone-50/50" 
						valueColor="text-stone-500" 
					/>
				</div>

				<div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm ring-1 ring-black/[0.03]">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-stone-50 border-b border-stone-200">
									<th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-500">Player</th>
									<th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-500">Outcome</th>
									<th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-500">Ticket Code</th>
									<th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">Batch</th>
									<th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">Tier</th>
									<th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">Payout Status</th>
									<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500 text-right">Scanned</th>
									<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500 text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{players.length > 0 ? (
									players.map((p) => (
										<tr key={p._id} className="transition-colors hover:bg-stone-50/50">
											<td className="px-6 py-4 min-w-[200px]">
												<div className="min-w-0">
													<p className="truncate text-xs font-bold text-stone-900">{p.player?.name || "Anonymous"}</p>
													<div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-medium">
														<Phone size={10} className="text-stone-300" />
														{p.player?.phone || "Unknown"}
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												{p.tier === 'jackpot' ? (
													<span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
														JACKPOT
													</span>
												) : p.isWinner || p.isCashback ? (
													<span className="text-[10px] font-black uppercase tracking-widest text-stone-600">
														WINNER
													</span>
												) : (
													<span className="text-[10px] font-black uppercase tracking-widest text-stone-600">
														LOSER
													</span>
												)}
											</td>
											<td className="px-6 py-4">
												<span className="font-mono text-xs font-bold text-stone-800 tracking-tight">
													{(p.code || "-").match(/.{1,4}/g)?.join("-") || p.code}
												</span>
											</td>
											<td className="px-6 py-4">
												<span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">{p.batch}</span>
											</td>
											<td className="px-6 py-4">
												{p.tier ? (
													<span className="text-[10px] font-black uppercase tracking-widest text-stone-600">Tier {p.tier}</span>
												) : (
													<span className="text-[10px] font-black uppercase tracking-widest text-stone-300">—</span>
												)}
											</td>
											<td className="px-6 py-4">
												<span className={`text-[10px] font-black uppercase tracking-widest ${
													p.payoutStatus === "paid" ? "text-emerald-600" : 
													p.payoutStatus === "pending" ? "text-amber-600" : "text-stone-400"
												}`}>
													{p.payoutStatus || "NONE"}
												</span>
											</td>
											<td className="px-6 py-4 text-right">
												<p className="text-xs font-bold text-stone-800 tabular-nums">{new Date(p.createdAt).toLocaleDateString()}</p>
												<p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
													{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</p>
											</td>
											<td className="px-6 py-4 text-right">
												{(p.isWinner || p.isCashback) && p.payoutStatus !== "paid" ? (
													<button
														onClick={() => claimPayout(p._id)}
														className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-stone-600 hover:bg-amber-50 hover:text-amber-900 transition-all shadow-sm"
													>
														Pay Now
													</button>
												) : (
													<span className="text-[10px] font-black uppercase tracking-widest text-stone-300 italic">No Action</span>
												)}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={7} className="px-6 py-20 text-center">
											<div className="flex flex-col items-center justify-center opacity-40">
												<Users className="h-12 w-12 mb-4 text-zinc-400" />
												<p className="text-lg font-bold text-zinc-500">No players found</p>
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

export default Players;
