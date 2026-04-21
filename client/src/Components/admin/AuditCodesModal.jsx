import { useEffect, useState } from "react";
import { X, Search, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../../../lib/api";

const AuditCodesModal = ({ isOpen, onClose, batchId, batchNumber }) => {
	const [file, setFile] = useState(null);
	const [column, setColumn] = useState("A");
	const [range, setRange] = useState("100");
	const [includeDetailedList, setIncludeDetailedList] = useState(true);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [results, setResults] = useState(null);

	useEffect(() => {
		if (!isOpen) {
			setFile(null);
			setResults(null);
			return;
		}
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleAudit = async () => {
		if (!file) {
			toast.error("Please select an Excel file.");
			return;
		}
		setIsAnalyzing(true);
		setResults(null);

		const formData = new FormData();
		formData.append("file", file);
		formData.append("column", column);
		formData.append("range", range);
		if (batchId) formData.append("batchId", batchId);

		try {
			const { data } = await axios.post("/scratch-codes/audit", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			if (data.success) {
				setResults(data);
				toast.success("Audit complete!");
			} else {
				toast.error(data.message || "Audit failed.");
			}
		} catch (error) {
			console.error("Audit failed:", error);
			toast.error(error.response?.data?.message || "Audit failed. Check your file and settings.");
		} finally {
			setIsAnalyzing(false);
		}
	};

	const downloadResults = () => {
		if (!results?.results) return;
		
		const headers = ["Code", "Outcome", "Prize Amount", "Redeemed", "Tier", "Batch"];
		const rows = results.results.map(r => {
			const outcome = r.isWinner ? "Winner" : (r.isCashback ? "Cashback" : (r.found ? "Loser" : "Missing"));
			return [
				r.code,
				outcome,
				r.prizeAmount,
				r.isUsed ? "Yes" : "No",
				r.tier,
				r.batchName
			];
		});

		const csvContent = includeDetailedList ? [
			headers.join(","), 
			...rows.map(row => row.join(",")),
			"",
			"SUMMARY",
			`Total Analyzed,${results.totalAnalyzed}`,
			`Total Found,${results.totalFound}`,
			`Winners,${results.winnersCount}`,
			`Cashback,${results.cashbackCount}`,
			`Losers,${results.losersCount}`,
			`Missing,${results.missingCount}`
		].join("\n") : [
			"AUDIT SUMMARY",
			`Total Analyzed,${results.totalAnalyzed}`,
			`Total Found,${results.totalFound}`,
			`Winners,${results.winnersCount}`,
			`Cashback,${results.cashbackCount}`,
			`Losers,${results.losersCount}`,
			`Missing,${results.missingCount}`
		].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute("download", `baaloo_audit_results_${new Date().toISOString().slice(0,10)}.csv`);
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(url);
	};

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/55 p-4 backdrop-blur-sm"
			role="presentation"
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				className={`relative w-full ${results ? 'max-w-4xl' : 'max-w-md'} rounded-2xl bg-white p-6 shadow-2xl border border-amber-100 transition-all duration-300 max-h-[90vh] flex flex-col`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-6 shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-amber-100 rounded-lg text-amber-700">
							<Search size={24} />
						</div>
						<h2 className="text-xl font-bold text-stone-900">Batch Audit</h2>
						{batchNumber && (
							<span className="ml-2 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900/60 rounded text-[10px] font-black uppercase tracking-widest">
								{batchNumber}
							</span>
						)}
					</div>
					<button 
						onClick={onClose} 
						className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-600"
					>
						<X size={20} />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
					{!results ? (
						<div className="space-y-6">
							<p className="text-sm text-stone-600 leading-relaxed">
								Verify printed codes from the press by uploading their Excel dispatch file. We'll check each code's prize against the database.
							</p>

							<div className="space-y-4">
								<div>
									<label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Excel File (.xlsx)</label>
									<label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50 hover:bg-stone-100/50 hover:border-amber-300 transition-all cursor-pointer group">
										<div className="flex flex-col items-center justify-center pt-5 pb-6">
											<FileSpreadsheet className={`w-10 h-10 mb-2 ${file ? 'text-amber-600' : 'text-stone-400 group-hover:text-amber-500'}`} />
											<p className="text-sm text-stone-600 font-medium">
												{file ? file.name : 'Select press file'}
											</p>
											<p className="text-[10px] text-stone-400 uppercase font-bold tracking-tight mt-1">
												Drag and drop or click
											</p>
										</div>
										<input 
											type="file" 
											className="hidden" 
											accept=".xlsx" 
											onChange={(e) => setFile(e.target.files[0])}
										/>
									</label>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Code Column</label>
										<input 
											type="text"
											value={column}
											onChange={(e) => setColumn(e.target.value.toUpperCase())}
											placeholder="e.g. A"
											className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 font-bold"
										/>
										<p className="text-[10px] text-stone-400 mt-1 uppercase font-bold">Use A, B, C...</p>
									</div>
									<div>
										<label className="block text-xs font-bold text-stone-500 uppercase mb-2">Rows to Analyze</label>
										<input 
											type="number" 
											value={range}
											onChange={(e) => setRange(e.target.value)}
											className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
											placeholder="e.g. 500"
										/>
										<p className="text-[10px] text-stone-400 mt-1 uppercase font-bold">Max 500 recommended</p>
									</div>
								</div>

								<div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
									<div className="flex items-center gap-3">
										<div className={`p-2 rounded-lg ${includeDetailedList ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'}`}>
											<FileSpreadsheet size={18} />
										</div>
										<div>
											<p className="text-sm font-bold text-stone-900">Include Detailed List</p>
											<p className="text-[10px] text-stone-400 font-bold uppercase">Export codes & individual outcomes</p>
										</div>
									</div>
									<button 
										onClick={() => setIncludeDetailedList(!includeDetailedList)}
										className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${includeDetailedList ? 'bg-amber-800' : 'bg-stone-300'}`}
									>
										<span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeDetailedList ? 'translate-x-5' : 'translate-x-0'}`} />
									</button>
								</div>
							</div>

							<button
								onClick={handleAudit}
								disabled={isAnalyzing || !file}
								className={`w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-800 py-4 text-white font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] ${
									isAnalyzing || !file ? "opacity-50 cursor-not-allowed" : "hover:bg-amber-700 hover:shadow-xl hover:-translate-y-0.5"
								}`}
							>
								{isAnalyzing ? (
									<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
								) : (
									<Search size={20} />
								)}
								{isAnalyzing ? "Analyzing Batch..." : "Run Batch Audit"}
							</button>
						</div>
					) : (
						<div className="space-y-6">
							<div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
								<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
									<div className="text-center sm:text-left">
										<p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Analyzed</p>
										<p className="text-xl font-black text-stone-900">{results.totalAnalyzed}</p>
									</div>
									<div className="h-6 w-px bg-stone-200 hidden sm:block" />
									<div className="text-center sm:text-left">
										<p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Winners</p>
										<p className="text-xl font-black text-emerald-600">{results.winnersCount}</p>
									</div>
									<div className="h-6 w-px bg-stone-200 hidden sm:block" />
									<div className="text-center sm:text-left">
										<p className="text-[9px] font-black uppercase tracking-widest text-amber-500/60">Cashback</p>
										<p className="text-xl font-black text-amber-600">{results.cashbackCount}</p>
									</div>
									<div className="h-6 w-px bg-stone-200 hidden sm:block" />
									<div className="text-center sm:text-left">
										<p className="text-[9px] font-black uppercase tracking-widest text-rose-500/60">Missing</p>
										<p className="text-xl font-black text-rose-600">{results.missingCount}</p>
									</div>
								</div>
								<button 
									onClick={downloadResults}
									className="flex items-center gap-2 px-6 py-2 bg-white border border-stone-200 rounded-full text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all shadow-sm"
								>
									<Download size={16} />
									{includeDetailedList ? "Download Full Report" : "Download Summary Only"}
								</button>
							</div>

							{includeDetailedList ? (
								<div className="overflow-hidden rounded-xl border border-stone-100 shadow-sm">
									<table className="w-full text-left border-collapse">
										<thead className="bg-stone-50">
											<tr>
												<th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-500">Status</th>
												<th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-500">Code</th>
												<th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-500 text-center">Outcome</th>
												<th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-500 text-right">Prize</th>
												<th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-500 text-center">Redeemed</th>
												<th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-500">Tier</th>
												<th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-500">Batch</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-stone-100">
											{results.results.map((r, i) => (
												<tr key={i} className="hover:bg-stone-50/50 transition-colors">
													<td className="px-4 py-3">
														{r.found ? (
															<CheckCircle2 size={18} className="text-emerald-500" />
														) : (
															<AlertCircle size={18} className="text-rose-500" />
														)}
													</td>
													<td className="px-4 py-3 font-mono text-xs font-bold text-stone-900">
														{r.code}
													</td>
													<td className="px-4 py-3 text-center">
														{r.isWinner ? (
															<span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black uppercase tracking-tighter">Winner</span>
														) : r.isCashback ? (
															<span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-black uppercase tracking-tighter">Cashback</span>
														) : r.found ? (
															<span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-500 rounded text-[10px] font-black uppercase tracking-tighter">Loser</span>
														) : (
															<span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[10px] font-black uppercase tracking-tighter">Missing</span>
														)}
													</td>
													<td className="px-4 py-3 text-right font-black text-stone-900 tabular-nums">
														{r.prizeAmount > 0 ? `GH₵ ${r.prizeAmount}` : '—'}
													</td>
													<td className="px-4 py-3 text-center">
														{r.isUsed ? (
															<span className="text-[10px] font-black text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded uppercase">Yes</span>
														) : (
															<span className="text-[10px] font-bold text-stone-300 uppercase">No</span>
														)}
													</td>
													<td className="px-4 py-3 text-xs font-bold text-stone-600 uppercase">
														{r.tier}
													</td>
													<td className="px-4 py-3 text-[10px] font-black text-amber-900/60 uppercase">
														{r.batchName}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="p-12 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
									<p className="text-stone-400 text-sm font-bold italic">Detailed list is hidden for security.</p>
								</div>
							)}

							<div className="flex justify-center">
								<button 
									onClick={() => setResults(null)}
									className="text-sm font-bold text-amber-800 hover:underline"
								>
									Audit another file
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AuditCodesModal;
