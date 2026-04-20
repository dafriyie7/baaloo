import { useState, useEffect, useCallback } from "react";
import axios from "../../../lib/api";
import AdminPageHeading from "../../Components/admin/AdminPageHeading";
import { useAppcontext } from "../../context/AppContext";
import { Search, Filter, Clock, User, Shield, Info, ArrowLeft, ArrowRight, Globe, Monitor, Laptop, History } from "lucide-react";
import AdminPagination from "../../Components/admin/AdminPagination";
import AdminHeader from "../../Components/admin/AdminHeader";

const ACTION_LABELS = {
	LOGIN: { label: "Login", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
	LOGOUT: { label: "Logout", color: "bg-stone-50 text-stone-600 border-stone-100" },
	GENERATE_BATCH: { label: "Batch Created", color: "bg-amber-50 text-amber-700 border-amber-100" },
	EXPORT_CODES: { label: "Exported Codes", color: "bg-blue-50 text-blue-700 border-blue-100" },
	AUDIT_BATCH: { label: "Batch Audit", color: "bg-purple-50 text-purple-700 border-purple-100" },
	DELETE_BATCH: { label: "Deleted Batch", color: "bg-red-50 text-red-700 border-red-100" },
	REGISTER_ADMIN: { label: "Admin Registered", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
	UPDATE_PASSWORD: { label: "Password Update", color: "bg-rose-50 text-rose-700 border-rose-100" },
	DELETE_ADMIN: { label: "Admin Removed", color: "bg-red-50 text-red-700 border-red-100" },
	REVEAL_OUTCOMES: { label: "Revealed Prizes", color: "bg-orange-50 text-orange-700 border-orange-100" },
	REVEAL_SYMBOLS: { label: "Revealed Symbols", color: "bg-orange-50 text-orange-700 border-orange-100" },
	FILTER_BY_TIER: { label: "Tier Filtered", color: "bg-orange-50 text-orange-700 border-orange-100" },
	REDEMPTION: { label: "Ticket Redemption", color: "bg-sky-50 text-sky-700 border-sky-100" },
};

const AuditLogs = () => {
	const { setIsLoading } = useAppcontext();
	const [logs, setLogs] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [limit, setLimit] = useState(20);
	const [actionFilter, setActionFilter] = useState("");
	const [datePreset, setDatePreset] = useState("all"); // all, today, yesterday, 7d, 30d, custom
	const [customStartDate, setCustomStartDate] = useState("");
	const [customEndDate, setCustomEndDate] = useState("");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
		return () => clearTimeout(t);
	}, [search]);

	const fetchLogs = useCallback(async () => {
		setIsLoading(true);
		
		let startDate, endDate;
		const now = new Date();
		const startOfToday = new Date(now.setHours(0, 0, 0, 0));
		const endOfToday = new Date(now.setHours(23, 59, 59, 999));

		if (datePreset === "today") {
			startDate = startOfToday.toISOString();
		} else if (datePreset === "yesterday") {
			const yesterday = new Date(startOfToday);
			yesterday.setDate(yesterday.getDate() - 1);
			startDate = yesterday.toISOString();
			const endOfYesterday = new Date(yesterday);
			endOfYesterday.setHours(23, 59, 59, 999);
			endDate = endOfYesterday.toISOString();
		} else if (datePreset === "7d") {
			const sevenDaysAgo = new Date(startOfToday);
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			startDate = sevenDaysAgo.toISOString();
		} else if (datePreset === "30d") {
			const thirtyDaysAgo = new Date(startOfToday);
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			startDate = thirtyDaysAgo.toISOString();
		} else if (datePreset === "custom") {
			if (customStartDate) startDate = new Date(customStartDate).toISOString();
			if (customEndDate) {
				const end = new Date(customEndDate);
				end.setHours(23, 59, 59, 999);
				endDate = end.toISOString();
			}
		}

		try {
			const { data } = await axios.get("/auth/audit-logs", {
				params: { page, action: actionFilter, search: debouncedSearch, startDate, endDate, limit },
			});
			if (data.success) {
				setLogs(data.data);
				setTotal(data.total);
				setTotalPages(data.pages);
			}
		} catch (error) {
			console.error("Fetch logs error:", error);
		} finally {
			setIsLoading(false);
		}
	}, [page, actionFilter, datePreset, customStartDate, customEndDate, setIsLoading]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	const clearFilters = () => {
		setSearch("");
		setActionFilter("");
		setDatePreset("all");
		setCustomStartDate("");
		setCustomEndDate("");
		setPage(1);
	};

	const formatMetadata = (details) => {
		if (!details) return "—";
		if (typeof details === "string") return details;
		
		const entries = Object.entries(details);
		if (entries.length === 0) return "—";

		// Extract reason if it exists to show it prominently
		const reason = details.reason;
		const otherEntries = entries.filter(([key]) => key !== "reason");

		return (
			<div className="space-y-2 max-w-[300px]">
				{reason && (
					<div className="group relative">
						<p 
							className="text-[11px] font-semibold text-stone-800 leading-snug line-clamp-2 italic"
							title={reason.length > 60 ? reason : ""}
						>
							"{reason}"
						</p>
						{reason.length > 60 && (
							<span className="text-[9px] text-amber-700 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
								Hover for full text
							</span>
						)}
					</div>
				)}
				<div className="flex flex-wrap gap-1.5">
					{otherEntries.map(([key, val]) => (
						<span key={key} className="inline-flex items-center rounded-sm bg-stone-50 px-1.5 py-0.5 text-[10px] font-medium text-stone-500 border border-stone-200/50">
							<span className="opacity-60 mr-1 uppercase tracking-tighter text-[9px]">{key}:</span>
							<span className="font-bold">{String(val)}</span>
						</span>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<AdminHeader 
				title="Activity Logs"
				subtitle="Monitor administrative actions, security reveals, and system events."
				icon={History}
				search={search}
				setSearch={setSearch}
				searchPlaceholder="Search events or administrators..."
				showClear={search || actionFilter !== "" || datePreset !== "all"}
				onClear={() => {
					setSearch("");
					setActionFilter("");
					setDatePreset("all");
					setPage(1);
				}}
				filters={[
					{
						label: "Event",
						value: actionFilter,
						onChange: (val) => { setActionFilter(val); setPage(1); },
						options: Object.entries(ACTION_LABELS).map(([val, { label }]) => ({ value: val, label }))
					},
					{
						label: "Timeframe",
						value: datePreset,
						onChange: (val) => { setDatePreset(val); setPage(1); },
						options: [
							{ value: "today", label: "Today" },
							{ value: "yesterday", label: "Yesterday" },
							{ value: "7d", label: "Last 7 Days" },
							{ value: "30d", label: "Last 30 Days" },
							{ value: "custom", label: "Custom Range" }
						]
					},
					{
						label: "Show",
						value: limit,
						onChange: (val) => { setLimit(Number(val)); setPage(1); },
						options: [
							{ value: 10, label: "10 per page" },
							{ value: 20, label: "20 per page" },
							{ value: 50, label: "50 per page" },
							{ value: 100, label: "100 per page" }
						]
					}
				]}
			/>

			{datePreset === "custom" && (
				<div className="mb-6 flex gap-4 p-4 bg-white border border-amber-100 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2">
					<div className="flex-1">
						<label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-stone-400">From</label>
						<input
							type="date"
							value={customStartDate}
							onChange={(e) => { setCustomStartDate(e.target.value); setPage(1); }}
							className="w-full rounded-md border border-amber-100 bg-white py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 outline-none"
						/>
					</div>
					<div className="flex-1">
						<label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-stone-400">To</label>
						<input
							type="date"
							value={customEndDate}
							onChange={(e) => { setCustomEndDate(e.target.value); setPage(1); }}
							className="w-full rounded-md border border-amber-100 bg-white py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 outline-none"
						/>
					</div>
				</div>
			)}

			{/* Logs Table */}
			<div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm ring-1 ring-black/[0.03]">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-stone-50 border-b border-stone-200">
								<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500">Event</th>
								<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500">Administrator</th>
								<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500">Metadata</th>
								<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500">Origin (IP)</th>
								<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500">Device</th>
								<th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500 text-right">Time</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{logs.length > 0 ? (
								logs.map((log) => {
									const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "bg-stone-100 text-stone-600" };
									return (
										<tr key={log._id} className="transition-colors hover:bg-stone-50/50">
											<td className="px-6 py-4">
												<span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight border ${actionInfo.color}`}>
													{actionInfo.label}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="min-w-0">
													<p className="truncate text-xs font-bold text-stone-900">{log.user?.name ?? "Unknown Admin"}</p>
													<p className="truncate text-[10px] text-stone-400">{log.user?.email}</p>
												</div>
											</td>
											<td className="px-6 py-4">
												{formatMetadata(log.details)}
												{log.resourceId && (
													<p className="mt-1 text-[10px] font-mono text-stone-400">ID: {log.resourceId}</p>
												)}
											</td>
											<td className="px-6 py-4">
												<div className="flex flex-col gap-0.5">
													<div className="text-[11px] font-bold text-stone-800">
														{log.location || "Unknown Origin"}
													</div>
													<p className="text-[10px] font-mono text-stone-400 uppercase tracking-tighter">
														{log.ipAddress || "—"}
													</p>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex flex-col gap-0.5 min-w-[120px]">
													<div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
														<Monitor size={11} className="text-stone-400" />
														{log.browser || "Unknown"}
													</div>
													<div className="flex items-center gap-1.5 text-[10px] font-medium text-stone-400">
														<Laptop size={11} className="text-stone-300" />
														{log.os || "Unknown OS"}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 text-right">
												<div className="text-xs font-bold text-stone-800 whitespace-nowrap">
													{new Date(log.createdAt).toLocaleString()}
												</div>
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td colSpan="4" className="px-6 py-12 text-center text-stone-400">
										<Shield size={40} className="mx-auto mb-3 opacity-20" />
										<p className="text-sm font-medium">No activity logs found matching your filters.</p>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Controls */}
					<AdminPagination 
						currentPage={page} 
						totalPages={totalPages} 
						setCurrentPage={setPage} 
					/>
			</div>
		</div>
	);
};

export default AuditLogs;
