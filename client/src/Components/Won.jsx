import React, { useEffect, useState } from 'react';
import { Gift, ArrowRight, Sparkles, Home, Trophy, AlertTriangle } from 'lucide-react';
import { useAppcontext } from '../context/AppContext';
import './Confetti.css';

const Won = ({ winner, onClaim, onHome, claimDisabled }) => {
	const { systemSettings } = useAppcontext();
	const [confetti, setConfetti] = useState([]);

	useEffect(() => {
		const colors = ['#f59e0b', '#fbbf24', '#facc15', '#ffffff', '#fb7185', '#38bdf8'];
		const newConfetti = Array.from({ length: 50 }).map((_, i) => ({
			id: i,
			left: Math.random() * 100 + '%',
			delay: Math.random() * 5 + 's',
			duration: Math.random() * 3 + 2 + 's',
			color: colors[Math.floor(Math.random() * colors.length)],
			size: Math.random() * 8 + 4 + 'px'
		}));
		setConfetti(newConfetti);
	}, []);

	// Fallback if no winner data
	if (!winner) {
		return (
			<div className="w-full flex flex-col items-center justify-center p-6 bg-zinc-50 min-h-[100dvh]">
				<p className="text-zinc-500 font-medium">No winner information available.</p>
				<button onClick={onHome} className="mt-4 text-orange-600 font-bold hover:underline">Go Home</button>
			</div>
		);
	}

	const prizeAmount = Number(
		winner.amount ?? winner.code?.prizeAmount ?? 0
	).toFixed(0);
	const codeDisplay = winner.scratchCode || winner.code?.plainCode || winner.code?.code || "N/A";
	const playerName = winner.player?.name || winner.name || "Winner";
	const playerPhone = winner.player?.phone || winner.phone || "N/A";

	return (
		<div className="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-900 px-4 pt-32 pb-20 relative overflow-hidden">
			{/* Confetti */}
			{confetti.map((c, i) => (
				<div 
					key={c.id}
					className="confetti"
					style={{
						left: c.left,
						animationDelay: c.delay,
						animationDuration: c.duration,
						backgroundColor: c.color,
						width: c.size,
						height: c.size,
						borderRadius: i % 2 === 0 ? '50%' : '2px'
					}}
				/>
			))}

			{/* Sunburst Background */}
			<div className="sunburst opacity-40" aria-hidden />
			
			{/* Animated Background shapes */}
			<div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/4 -translate-y-1/4 rounded-full bg-amber-500/20 blur-[120px] animate-pulse" aria-hidden />
			<div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] -translate-x-1/4 translate-y-1/4 rounded-full bg-orange-600/20 blur-[100px] animate-pulse delay-1000" aria-hidden />
			
			<div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-700">
				<div className="flex flex-col items-center justify-center text-center">
					<div className="relative mb-6 float">
						<div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-20 duration-[3000ms]"></div>
						<div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 shadow-[0_0_50px_rgba(245,158,11,0.5)] border-4 border-white/20">
							<Trophy className="h-16 w-16 text-white drop-shadow-lg" strokeWidth={2.5} />
							<Sparkles className="absolute -right-3 -top-3 h-10 w-10 text-amber-300 animate-bounce" />
							<Sparkles className="absolute -bottom-2 -left-4 h-8 w-8 text-yellow-300 animate-bounce delay-150" />
						</div>
					</div>

					<div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)] mb-6 backdrop-blur-md">
						Ultimate Victory
					</div>
					
					<h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-2xl">
						YOU WON!
					</h1>
					<p className="text-xl text-amber-100/80 font-bold mb-10 max-w-xs mx-auto leading-tight">
						Bravo {playerName.split(' ')[0]}, your luck just paid off!
					</p>
				</div>

				<div className="rounded-[3rem] border border-white/10 bg-white/10 p-8 md:p-10 shadow-2xl backdrop-blur-2xl ring-1 ring-white/20 relative overflow-hidden group">
					<div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
					
					<div className="text-center mb-8 relative z-10">
						<p className="text-xs font-black uppercase tracking-widest text-amber-200/60 mb-2">Grand Prize Total</p>
						<div className="relative inline-block">
							<p className="text-7xl font-black text-shine tabular-nums">
								₵{prizeAmount}
							</p>
							<div className="absolute -right-8 -top-2">
								<Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
							</div>
						</div>
					</div>

					<div className="space-y-4 rounded-3xl bg-black/20 p-6 border border-white/5 relative z-10">
						<div className="flex justify-between items-center border-b border-white/5 pb-3">
							<span className="text-xs font-bold uppercase tracking-widest text-white/40">Verified User</span>
							<span className="font-black text-white text-sm">{playerPhone}</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-xs font-bold uppercase tracking-widest text-white/40">Game Token</span>
							<span className="font-mono font-black text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full text-xs border border-amber-400/20">{codeDisplay}</span>
						</div>
					</div>

					<div className="mt-10 flex flex-col gap-4 relative z-10">
						{winner.code?.tier === "jackpot" ? (
							<div className="p-6 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-600 border border-white/30 text-center shadow-2xl">
								<p className="text-white font-black mb-2 uppercase tracking-tight text-lg">Jackpot Secured!</p>
								<p className="text-white/90 text-sm leading-relaxed font-bold">
									Please contact Baaloo Management directly to claim this high-value prize. 
									Visit our headquarters with your phone and ID.
								</p>
							</div>
						) : (
							onClaim && (
								<div className="space-y-3">
									{!systemSettings.payoutsEnabled && (
										<div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-bold leading-relaxed">
											<AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
											<p>Automatic payouts are temporarily paused for routine maintenance. Your prize is secured—please check back soon.</p>
										</div>
									)}
									<button 
										type="button"
										disabled={claimDisabled || !systemSettings.payoutsEnabled}
										onClick={onClaim}
										className={`group relative flex w-full items-center justify-center gap-3 rounded-full py-5 text-xl font-black transition-all active:scale-[0.97] disabled:opacity-40 ${
											systemSettings.payoutsEnabled 
											? 'bg-white text-orange-600 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]' 
											: 'bg-white/10 text-white/40 cursor-not-allowed'
										}`}
									>
										{!systemSettings.payoutsEnabled 
											? "Payouts Paused" 
											: (claimDisabled ? "Transferring…" : "Claim Your GH₵ " + prizeAmount)
										}
										{systemSettings.payoutsEnabled && <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" strokeWidth={3} />}
									</button>
								</div>
							)
						)}
						{onHome && (
							<button 
								onClick={onHome}
								className="flex items-center justify-center gap-2 w-full rounded-full py-4 text-xs font-black uppercase tracking-widest text-white/40 transition-all hover:text-white hover:bg-white/5"
							>
								<Home size={14} /> Back to Entry
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Won;
