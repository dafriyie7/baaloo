import React from "react";
import { useAppcontext } from "../context/AppContext";
import { Gift, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ClaimWin = () => {
	const { winner } = useAppcontext();
	const navigate = useNavigate();

	// A robust check in case the user lands here without winner data
	if (!winner || !winner.name) {
		return (
			<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-300 px-4 py-8">
				<div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-amber-500/15 p-8 rounded-2xl shadow-2xl text-center">
					<h1 className="text-3xl font-bold text-amber-100/90 mb-4">
						No Winner Information
					</h1>
					<p>
						It seems there was an issue retrieving the winner's
						details. Please try scanning again.
					</p>
				</div>
			</div>
		);
	}

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		return new Date(dateString).toLocaleString("en-US", {
			dateStyle: "long",
			timeStyle: "short",
		});
	};

	return (
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-300 px-4 py-8">
			<div className="w-full max-w-lg bg-white/5 backdrop-blur-lg border border-amber-500/15 p-8 rounded-2xl shadow-2xl text-center">
				<div className="flex flex-col items-center mb-6">
					<Gift className="w-20 h-20 text-amber-300/90 mb-4" />
					<h1 className="text-4xl font-bold text-white">
						You're a Winner!
					</h1>
					<p className="text-slate-400 mt-2">
						Congratulations, {winner.name}! Here are your details.
					</p>
				</div>

				<div className="text-left bg-stone-950/60 p-6 rounded-lg border border-amber-800/25 space-y-4">
					<div className="flex justify-between">
						<span className="font-semibold text-slate-400">
							Name:
						</span>
						<span className="text-white">{winner.name}</span>
					</div>
					<div className="flex justify-between">
						<span className="font-semibold text-slate-400">
							Phone:
						</span>
						<span className="text-white">{winner.phone}</span>
					</div>
					<div className="flex justify-between">
						<span className="font-semibold text-slate-400">
							Winning Code:
						</span>
						<span className="font-mono text-amber-200/90">
							{winner.code.plainCode ?? winner.code.code}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="font-semibold text-slate-400">
							Prize Amount:
						</span>
						<span className="font-bold text-amber-200/90">
							GH₵{" "}
							{Number(
								winner.code.prizeAmount ??
									winner.code.batchNumber?.winningPrize ??
									0
							).toFixed(2)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="font-semibold text-slate-400">
							Redeemed On:
						</span>
						<span className="text-white">
							{formatDate(winner.code.redeemedAt)}
						</span>
					</div>
				</div>

				<div className="mt-8 text-center">
					<p className="text-slate-300">
						Your prize is being processed. You will be contacted
						shortly with further instructions.
					</p>
					<button
						onClick={() => navigate("/")}
						className="mt-6 inline-flex items-center gap-2 py-2 px-6 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-amber-800 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-700 transition-transform duration-300 hover:scale-105"
					>
						<ArrowLeft size={18} />
						Go Home
					</button>
				</div>
			</div>
		</div>
	);
};

export default ClaimWin;
