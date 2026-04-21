import { useState } from "react";
import { X, ShieldAlert, Lock, FileText, ChevronRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../../../lib/api";

const SecurityRevealModal = ({ isOpen, onClose, onVerified, actionType }) => {
	const [password, setPassword] = useState("");
	const [reason, setReason] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);

	const handleVerify = async (e) => {
		e.preventDefault();
		if (!reason.trim()) {
			return toast.error("Please provide a reason for access.");
		}

		setIsVerifying(true);
		try {
			const { data } = await axios.post("/auth/verify-step-up", { password });
			if (data.success) {
				onVerified(reason);
				setPassword("");
				setReason("");
				onClose();
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Verification failed.");
		} finally {
			setIsVerifying(false);
		}
	};

	if (!isOpen) return null;

	const getTitle = () => {
		if (actionType === "REVEAL_OUTCOMES") return "Reveal Ticket Outcomes";
		if (actionType === "REVEAL_SYMBOLS") return "Reveal Ticket Symbols";
		if (actionType === "FILTER_BY_TIER") return "Filter by Prize Tier";
		return "Sensitive Data Access";
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
			<div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
			
			<div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-2xl transition-all">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-6 py-4">
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900 shadow-sm">
							<ShieldAlert size={20} strokeWidth={2.5} />
						</div>
						<h2 className="text-base font-bold text-stone-900">{getTitle()}</h2>
					</div>
					<button onClick={onClose} className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleVerify} className="p-6">
					<div className="mb-6 rounded-xl bg-amber-50/50 p-4 border border-amber-100">
						<p className="text-xs font-medium leading-relaxed text-amber-900">
							<span className="font-bold">Security Notice:</span> Revealing sensitive ticket data is restricted. You must provide a valid reason and re-verify your password. This action is logged with your IP and location.
						</p>
					</div>

					<div className="space-y-4">
						{/* Reason for Access */}
						<div>
							<label className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
								<FileText size={12} />
								Reason for Access
							</label>
							<textarea
								required
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="e.g., Verifying prize distribution for customer support..."
								className="block w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10"
								rows="2"
							/>
						</div>

						{/* Admin Password */}
						<div>
							<label className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
								<Lock size={12} />
								Confirm Password
							</label>
							<input
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your admin password"
								className="block w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10"
							/>
						</div>
					</div>

					<div className="mt-8 flex flex-col gap-3">
						<button
							type="submit"
							disabled={isVerifying}
							className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-900/10 transition-all hover:bg-amber-700 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
						>
							{isVerifying ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<>
									Verify & Reveal
									<ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
								</>
							)}
						</button>
						<button
							type="button"
							onClick={onClose}
							className="w-full py-2 text-xs font-bold text-stone-400 transition-colors hover:text-stone-600 uppercase tracking-widest"
						>
							Cancel Access
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SecurityRevealModal;
