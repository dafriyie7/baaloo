import { useEffect, useState } from "react";
import { X, Download, Shuffle, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../../../lib/api";

const ExportTicketsModal = ({ isOpen, onClose, batchId, batchNumber }) => {
	const [order, setOrder] = useState("shuffled");
	const [isExporting, setIsExporting] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
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

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const { data } = await axios.get(`/scratch-codes/export/${batchId}`, {
				params: { order },
				responseType: "blob",
			});
			
			const url = window.URL.createObjectURL(new Blob([data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `baaloo_batch_${batchNumber}_${order}.csv`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
			
			toast.success("Export successful!");
			onClose();
		} catch (error) {
			console.error("Export failed:", error);
			toast.error("Export failed. Please try again.");
		} finally {
			setIsExporting(false);
		}
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
				className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-amber-100"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold text-stone-900">Export Tickets</h2>
					<button 
						onClick={onClose} 
						className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-600"
					>
						<X size={20} />
					</button>
				</div>

				<div className="space-y-6">
					<div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
						<p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Target Batch</p>
						<p className="text-lg font-black text-amber-900">{batchNumber}</p>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<button
							onClick={() => setOrder("shuffled")}
							className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 ${
								order === "shuffled"
									? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm"
									: "border-stone-100 bg-white text-stone-400 hover:border-stone-200"
							}`}
						>
							<Shuffle size={28} className={`mb-3 ${order === "shuffled" ? "text-amber-600" : ""}`} />
							<span className="font-bold text-sm">Shuffled</span>
							<span className="text-[10px] font-medium uppercase tracking-wider opacity-60">Random</span>
						</button>

						<button
							onClick={() => setOrder("grouped")}
							className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 ${
								order === "grouped"
									? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm"
									: "border-stone-100 bg-white text-stone-400 hover:border-stone-200"
							}`}
						>
							<LayoutGrid size={28} className={`mb-3 ${order === "grouped" ? "text-amber-600" : ""}`} />
							<span className="font-bold text-sm">Grouped</span>
							<span className="text-[10px] font-medium uppercase tracking-wider opacity-60">By Tier</span>
						</button>
					</div>

					<button
						onClick={handleExport}
						disabled={isExporting}
						className={`w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-800 py-4 text-white font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] ${
							isExporting ? "opacity-50 cursor-not-allowed" : "hover:bg-amber-700 hover:shadow-xl hover:-translate-y-0.5"
						}`}
					>
						{isExporting ? (
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
						) : (
							<Download size={20} />
						)}
						{isExporting ? "Generating..." : "Download CSV"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ExportTicketsModal;
