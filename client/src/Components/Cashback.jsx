import React from 'react';
import { Wallet, Sparkles, RefreshCw } from 'lucide-react';

const Cashback = ({ amount, message, onRetry, onClaim }) => {
	const displayAmount = amount ? Number(amount).toFixed(2) : "0.00";

	return (
		<div className="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 px-4 py-12 relative overflow-hidden">
			{/* Background shapes */}
			<div className="absolute top-0 right-0 -z-10 h-[400px] w-[400px] translate-x-1/4 -translate-y-1/4 rounded-full bg-emerald-300/20 blur-[100px]" aria-hidden />
			<div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/4 rounded-full bg-teal-300/20 blur-[80px]" aria-hidden />
			
			<div className="w-full max-w-md relative z-10">
				<div className="flex flex-col items-center justify-center text-center">
					<div className="relative mb-8">
						<div className="absolute inset-0 animate-pulse rounded-full bg-emerald-200 opacity-40 duration-[2000ms]"></div>
						<div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/20 border-4 border-white">
							<Wallet className="h-10 w-10 text-white" strokeWidth={2.5} />
							<Sparkles className="absolute -right-2 -top-1 h-6 w-6 text-emerald-300 animate-bounce delay-100" />
						</div>
					</div>

					<div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-emerald-700 shadow-sm mb-4">
						Cashback
					</div>
					
					<h1 className="text-4xl font-black text-zinc-900 mb-2">
						Money Back!
					</h1>
					<p className="text-base text-zinc-600 font-medium mb-8">
						{message || "You didn't win the grand prize, but you got your money back!"}
					</p>
				</div>

				<div className="rounded-[2rem] border border-white bg-white/70 p-6 md:p-8 shadow-xl backdrop-blur-xl">
					<div className="text-center mb-8">
						<p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Cashback Amount</p>
						<p className="text-5xl font-black text-emerald-600">
							GH₵ {displayAmount}
						</p>
					</div>

					<div className="flex flex-col gap-3">
						{onClaim && (
							<button 
								onClick={onClaim}
								className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
							>
								Claim Cashback
							</button>
						)}
						
						{onRetry && (
							<button 
								onClick={onRetry}
								className="group flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98]"
							>
								<RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180 duration-500" />
								Play Again
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Cashback;
