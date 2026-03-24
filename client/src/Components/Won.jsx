import React from 'react';
import { Gift, ArrowRight, Sparkles } from 'lucide-react';

const Won = ({ winner, onClaim, onHome }) => {
	// Fallback if no winner data
	if (!winner) {
		return (
			<div className="w-full flex flex-col items-center justify-center p-6 bg-zinc-50 min-h-[100dvh] rounded-3xl">
				<p className="text-zinc-500 font-medium">No winner information available.</p>
				<button onClick={onHome} className="mt-4 text-orange-600 font-bold hover:underline">Go Home</button>
			</div>
		);
	}

	const prizeAmount = Number(
		winner.code?.prizeAmount ?? winner.code?.batchNumber?.winningPrize ?? 0
	).toFixed(2);
	const codeDisplay = winner.code?.plainCode ?? winner.code?.code ?? "N/A";

	return (
		<div className="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 px-4 py-12 relative overflow-hidden">
			{/* Background shapes */}
			<div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-orange-300/20 blur-[100px]" aria-hidden />
			<div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/3 rounded-full bg-amber-400/20 blur-[80px]" aria-hidden />
			
			<div className="w-full max-w-lg relative z-10">
				<div className="flex flex-col items-center justify-center text-center">
					<div className="relative mb-8">
						<div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-20 duration-[3000ms]"></div>
						<div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-orange-500/30">
							<Gift className="h-14 w-14 text-white" strokeWidth={2} />
							<Sparkles className="absolute -right-2 -top-2 h-8 w-8 text-amber-500 animate-bounce delay-75" />
							<Sparkles className="absolute -bottom-1 -left-3 h-6 w-6 text-orange-400 animate-bounce delay-150" />
						</div>
					</div>

					<div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-amber-700 shadow-sm mb-4">
						Winner
					</div>
					
					<h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-2">
						Congratulations!
					</h1>
					<p className="text-lg text-zinc-600 font-medium mb-8">
						{winner.name}, you just won a prize!
					</p>
				</div>

				<div className="rounded-[2rem] border border-white bg-white/60 p-6 md:p-8 shadow-2xl backdrop-blur-xl transition-all">
					<div className="text-center mb-6">
						<p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Prize Amount</p>
						<p className="text-5xl font-black bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
							GH₵ {prizeAmount}
						</p>
					</div>

					<div className="space-y-4 rounded-2xl bg-zinc-50/80 p-5 border border-zinc-100">
						<div className="flex justify-between items-center">
							<span className="font-semibold text-zinc-500">Phone</span>
							<span className="font-bold text-zinc-900">{winner.phone}</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="font-semibold text-zinc-500">Winning Code</span>
							<span className="font-mono font-bold text-orange-600 bg-orange-100/50 px-2 py-0.5 rounded-md">{codeDisplay}</span>
						</div>
					</div>

					<div className="mt-8 flex flex-col gap-3">
						{onClaim && (
							<button 
								onClick={onClaim}
								className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
							>
								Claim Prize Now
								<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
							</button>
						)}
						{onHome && (
							<button 
								onClick={onHome}
								className="w-full rounded-full py-4 text-sm font-bold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
							>
								Go Home
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Won;
