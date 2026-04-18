import { useState, useEffect, useCallback } from "react";
import axios from "../../../lib/api";
import AdminPageHeading from "../../Components/admin/AdminPageHeading";
import { useAppcontext } from "../../context/AppContext";
import { Search, Filter, Clock, User, Shield, Info, ArrowLeft, ArrowRight, Globe, Monitor, Laptop } from "lucide-react";

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
};

const AuditLogs = () => {
	const { setIsLoading } = useAppcontext();
	const [logs, setLogs] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [actionFilter, setActionFilter] = useState("");

	const fetchLogs = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data } = await axios.get("/auth/audit-logs", {
				params: { page, action: actionFilter, limit: 20 },
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
	}, [page, actionFilter, setIsLoading]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	const formatMetadata = (details) => {
		if (!details) return "—";
		if (typeof details === "string") return details;
		
		// Simplify common metadata for display
		const entries = Object.entries(details);
		if (entries.length === 0) return "—";

		return (
			<div className="flex flex-wrap gap-1.5">
				{entries.map(([key, val]) => (
					<span key={key} className="inline-flex items-center rounded-sm bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 border border-stone-200">
						<span className="opacity-60 mr-1">{key}:</span>
						<span className="font-bold">{String(val)}</span>
					</span>
				))}
			</div>
		);
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<AdminPageHeading 
				title="Activity Logs" 
				subtitle="Monitor administrative actions and security events across the system."
			/>

			{/* Filters */}
			<div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
				<div className="flex-1 min-w-[200px]">
					<label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-stone-400">Filter by Event</label>
					<div className="relative">
						<Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
						<select
							value={actionFilter}
							onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
							className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
						>
							<option value="">All Activities</option>
							{Object.entries(ACTION_LABELS).map(([val, { label }]) => (
								<option key={val} value={val}>{label}</option>
							))}
						</select>
					</div>
				</div>
				<div className="flex items-end h-full pt-5">
					<button 
						onClick={() => { setActionFilter(""); setPage(1); }}
						className="text-xs font-bold text-amber-800 hover:text-amber-900 transition-colors uppercase tracking-tighter"
					>
						Clear Filters
					</button>
				</div>
			</div>

			{/* Logs Table */}
			<div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm ring-1 ring-black/[0.03]">
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
												<span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight border ${actionInfo.color}`}>
													{actionInfo.label}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2.5">
													<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600 border border-stone-200">
														{log.user?.name?.[0]?.toUpperCase() ?? "?"}
													</div>
													<div className="min-w-0">
														<p className="truncate text-xs font-bold text-stone-900">{log.user?.name ?? "Unknown Admin"}</p>
														<p className="truncate text-[10px] text-stone-400">{log.user?.email}</p>
													</div>
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
													<div className="flex items-center gap-1 text-[11px] font-bold text-stone-800">
														<Globe size={11} className="text-amber-800" />
														{log.location || "Unknown"}
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
												<div className="flex items-center justify-end gap-1.5 text-xs font-bold text-stone-800 whitespace-nowrap">
													<Clock size={12} className="text-stone-400" />
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

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-stone-200 bg-stone-50/50 px-6 py-4">
						<p className="text-xs text-stone-500">
							Showing page <span className="font-bold text-stone-900">{page}</span> of <span className="font-bold text-stone-900">{totalPages}</span>
						</p>
						<div className="flex gap-2">
							<button
								disabled={page === 1}
								onClick={() => setPage(page - 1)}
								className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
							>
								<ArrowLeft size={16} />
							</button>
							<button
								disabled={page === totalPages}
								onClick={() => setPage(page + 1)}
								className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
							>
								<ArrowRight size={16} />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AuditLogs;
