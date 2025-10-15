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
			<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-300 px-4 py-8">
				<div className="w-full max-w-md bg-slate-200/10 backdrop-blur-lg border border-slate-400/20 p-8 rounded-2xl shadow-2xl text-center">
					<h1 className="text-3xl font-bold text-slate-200 mb-4">
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
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-300 px-4 py-8">
			<div className="w-full max-w-lg bg-slate-200/10 backdrop-blur-lg border border-slate-400/20 p-8 rounded-2xl shadow-2xl text-center">
				<div className="flex flex-col items-center mb-6">
					<Gift className="w-20 h-20 text-yellow-400 mb-4" />
					<h1 className="text-4xl font-bold text-white">
						You're a Winner!
					</h1>
					<p className="text-slate-400 mt-2">
						Congratulations, {winner.name}! Here are your details.
					</p>
				</div>

				<div className="text-left bg-slate-900/50 p-6 rounded-lg border border-slate-700 space-y-4">
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
						<span className="font-mono text-green-400">
							{winner.code.code}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="font-semibold text-slate-400">
							Prize Amount:
						</span>
						<span className="font-bold text-yellow-400">
							GH₵{" "}
							{winner.code.batchNumber.winningPrize.toFixed(2)}
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
						className="mt-6 inline-flex items-center gap-2 py-2 px-6 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105"
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
