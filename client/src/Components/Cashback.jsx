import React, { useEffect, useState } from 'react';
import { Wallet, Sparkles, RefreshCw, Home, Coins, AlertTriangle } from 'lucide-react';
import { useAppcontext } from '../context/AppContext';
import './Confetti.css';

const Cashback = ({ amount, message, onRetry, onClaim, claimDisabled, onHome }) => {
	const { systemSettings } = useAppcontext();
	const [coins, setCoins] = useState([]);

	useEffect(() => {
		const newCoins = Array.from({ length: 30 }).map((_, i) => ({
			id: i,
			left: Math.random() * 100 + '%',
			delay: Math.random() * 5 + 's',
			duration: Math.random() * 3 + 2 + 's',
			size: Math.random() * 10 + 10 + 'px'
		}));
		setCoins(newCoins);
	}, []);

	const displayAmount = amount ? Number(amount).toFixed(0) : "0";

	return (
		<div className="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 px-4 pt-32 pb-20 relative overflow-hidden">
			{/* Coin Rain */}
			{coins.map(c => (
				<div 
					key={c.id}
					className="confetti"
					style={{
						left: c.left,
						animationDelay: c.delay,
						animationDuration: c.duration,
						backgroundColor: '#fbbf24',
						width: c.size,
						height: c.size,
						borderRadius: '50%',
						border: '2px solid #d97706',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '8px',
						fontWeight: 'bold',
						color: '#d97706',
						zIndex: 5
					}}
				>
					₵
				</div>
			))}

			{/* Background shapes */}
			<div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/4 -translate-y-1/4 rounded-full bg-emerald-400/10 blur-[100px]" aria-hidden />
			<div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/4 rounded-full bg-amber-400/20 blur-[80px]" aria-hidden />
			
			<div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
				<div className="flex flex-col items-center justify-center text-center">
					<div className="relative mb-6 float">
						<div className="absolute inset-0 animate-pulse rounded-full bg-emerald-200 opacity-40 duration-[2000ms]"></div>
						<div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/20 border-4 border-white">
							<Wallet className="h-12 w-12 text-white" strokeWidth={2.5} />
							<Coins className="absolute -right-2 -top-1 h-8 w-8 text-amber-400 animate-bounce delay-100" />
						</div>
					</div>

					<div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-xs font-black uppercase tracking-widest text-emerald-700 shadow-sm mb-4">
						Safe Entry
					</div>
					
					<h1 className="text-4xl font-black text-zinc-900 mb-2">
						MONEY BACK!
					</h1>
					<p className="text-base text-zinc-600 font-medium mb-10 max-w-[280px] mx-auto">
						{message || "You didn't win the prize, but we've returned your entry fee!"}
					</p>
				</div>

				<div className="rounded-[2.5rem] border border-white bg-white/80 p-8 md:p-10 shadow-2xl backdrop-blur-xl ring-1 ring-zinc-200/50">
					<div className="text-center mb-8">
						<p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Cashback Amount</p>
						<p className="text-6xl font-black text-emerald-600 tabular-nums">
							₵{displayAmount}
						</p>
					</div>

					<div className="flex flex-col gap-4">
						{onClaim && (
							<div className="space-y-3">
								{!systemSettings.payoutsEnabled && (
									<div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold leading-relaxed">
										<AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
										<p>Payouts are temporarily paused for maintenance. Your cashback is safe—please check back soon.</p>
									</div>
								)}
								<button 
									onClick={onClaim}
									disabled={claimDisabled || !systemSettings.payoutsEnabled}
									className={`group flex w-full items-center justify-center gap-3 rounded-full py-5 text-lg font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${
										systemSettings.payoutsEnabled
										? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:scale-[1.02] hover:shadow-xl'
										: 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
									}`}
								>
									{!systemSettings.payoutsEnabled 
										? "Payouts Paused" 
										: (claimDisabled ? "Processing..." : "Claim GH₵ " + displayAmount)
									}
									{systemSettings.payoutsEnabled && <Sparkles className="h-5 w-5" />}
								</button>
							</div>
						)}
						
						{onRetry && (
							<button 
								onClick={onRetry}
								className="group flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 py-4 text-base font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98]"
							>
								<RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
								Try Another Code
							</button>
						)}

						{onHome && (
							<button 
								onClick={onHome}
								className="flex items-center justify-center gap-2 w-full rounded-full py-2 text-xs font-bold text-zinc-400 transition-colors hover:text-zinc-600"
							>
								<Home size={14} /> Back to Start
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Cashback;
