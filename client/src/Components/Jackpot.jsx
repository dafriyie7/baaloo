import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, MapPin, Phone, MessageSquare, ShieldCheck, Home, ArrowRight, IdCard } from 'lucide-react';
import './Confetti.css';

const Jackpot = ({ winner, onHome }) => {
	const [confetti, setConfetti] = useState([]);

	useEffect(() => {
		const colors = ['#f59e0b', '#fbbf24', '#facc15', '#ffffff', '#ffd700', '#c5a059'];
		const newConfetti = Array.from({ length: 80 }).map((_, i) => ({
			id: i,
			left: Math.random() * 100 + '%',
			delay: Math.random() * 6 + 's',
			duration: Math.random() * 4 + 2 + 's',
			color: colors[Math.floor(Math.random() * colors.length)],
			size: Math.random() * 10 + 5 + 'px'
		}));
		setConfetti(newConfetti);
	}, []);

	const prizeAmount = Number(winner?.amount ?? winner?.code?.prizeAmount ?? 0).toFixed(0);
	const codeDisplay = winner?.scratchCode || winner?.code?.plainCode || "********";
	const playerName = winner?.player?.name || winner?.name || "Lucky Winner";

	return (
		<div className="w-full min-h-screen flex flex-col items-center justify-start bg-zinc-950 px-4 pt-[calc(var(--app-nav-height,4.5rem)+2rem)] pb-12 relative overflow-y-auto overflow-x-hidden">
			{/* Intense Golden Confetti */}
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
						borderRadius: i % 2 === 0 ? '50%' : '2px',
						boxShadow: '0 0 10px ' + c.color
					}}
				/>
			))}

			{/* Massive Rotating Sunburst */}
			<div className="sunburst opacity-10 scale-150" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg, rgba(251,191,36,0.15) 0deg 10deg, transparent 10deg 20deg)' }} aria-hidden />
			
			<div className="w-full max-w-xl relative z-10">
				{/* Top Header Section */}
				<div className="flex flex-col items-center justify-center text-center mb-6">
					<div className="relative mb-6 float">
						<div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-20 duration-[2000ms]"></div>
						<div className="relative flex h-28 w-28 md:h-36 md:w-36 items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 shadow-[0_0_50px_rgba(245,158,11,0.4)] border-4 border-white/30 rotate-3">
							<Trophy className="h-14 w-14 md:h-16 md:w-16 text-zinc-950 drop-shadow-2xl" strokeWidth={2.5} />
							<Sparkles className="absolute -right-2 -top-2 h-8 w-8 text-amber-200 animate-bounce" />
						</div>
					</div>

					<div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 backdrop-blur-xl animate-reveal mb-4">
						Legendary Achievement
					</div>
					
					<h1 className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tight drop-shadow-lg leading-none">
						JACKPOT <span className="block bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent italic">SECURED</span>
					</h1>
					<p className="text-lg md:text-xl text-amber-100/70 font-bold max-w-xs mx-auto leading-tight italic">
						Congratulations {playerName.split(' ')[0]}!
					</p>
				</div>

				{/* The Jackpot Card */}
				<div className="jackpot-pulse rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 bg-gradient-to-b from-zinc-900/90 to-black/95 p-8 md:p-12 shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
					<div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
					
					<div className="text-center mb-8 relative z-10">
						<div className="flex items-center justify-center gap-2 mb-2">
							<div className="h-px w-6 bg-amber-500/20" />
							<p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/60">Grand Prize</p>
							<div className="h-px w-6 bg-amber-500/20" />
						</div>
						<div className="relative inline-block gold-shine-container px-4 py-1">
							<p className="text-7xl md:text-8xl font-black text-shine tabular-nums drop-shadow-2xl">
								₵{prizeAmount}
							</p>
						</div>
						<div className="mt-4 flex justify-center">
							<div className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
								<span className="text-[8px] font-black uppercase tracking-widest text-white/30">Token</span>
								<span className="font-mono font-black text-amber-400/90 text-xs">{codeDisplay}</span>
							</div>
						</div>
					</div>

					{/* Manual Guide Section */}
					<div className="space-y-6 relative z-10">
						<div className="grid gap-3 md:grid-cols-3">
							<div className="flex flex-row md:flex-col items-center md:text-center p-4 rounded-2xl bg-white/5 border border-white/5 gap-4 md:gap-2">
								<div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
									<IdCard size={20} />
								</div>
								<div className="flex flex-col md:items-center">
									<p className="text-[8px] font-black uppercase tracking-widest text-amber-500/60 md:mb-1">Step 01</p>
									<p className="text-[11px] font-bold text-white/90 leading-tight">Bring valid ID & phone</p>
								</div>
							</div>
							
							<div className="flex flex-row md:flex-col items-center md:text-center p-4 rounded-2xl bg-white/5 border border-white/5 gap-4 md:gap-2">
								<div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
									<MapPin size={20} />
								</div>
								<div className="flex flex-col md:items-center">
									<p className="text-[8px] font-black uppercase tracking-widest text-amber-500/60 md:mb-1">Step 02</p>
									<p className="text-[11px] font-bold text-white/90 leading-tight">Visit HQ - Accra</p>
								</div>
							</div>
							
							<div className="flex flex-row md:flex-col items-center md:text-center p-4 rounded-2xl bg-white/5 border border-white/5 gap-4 md:gap-2">
								<div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
									<ShieldCheck size={20} />
								</div>
								<div className="flex flex-col md:items-center">
									<p className="text-[8px] font-black uppercase tracking-widest text-amber-500/60 md:mb-1">Step 03</p>
									<p className="text-[11px] font-bold text-white/90 leading-tight">Instant Verification</p>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="pt-2 flex flex-col gap-3">
							<a 
								href="tel:+233240000000"
								className="flex items-center justify-center gap-3 w-full rounded-full bg-white py-4 text-base font-black text-zinc-950 transition-all active:scale-95 shadow-xl hover:bg-zinc-100"
							>
								<Phone size={18} /> Call for Appointment
							</a>
							
							<div className="grid grid-cols-2 gap-3">
								<a 
									href="https://maps.google.com" 
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 py-3.5 text-[9px] font-black uppercase tracking-widest text-white border border-white/5 hover:bg-white/10"
								>
									<MapPin size={12} className="text-amber-500" /> Directions
								</a>
								<a 
									href="https://wa.me/233240000000" 
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 py-3.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/10"
								>
									<MessageSquare size={12} /> WhatsApp
								</a>
							</div>
							
							<button 
								onClick={onHome}
								className="mt-2 flex items-center justify-center gap-2 w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors"
							>
								<Home size={12} /> Return Home
							</button>
						</div>
					</div>
				</div>
				
				<div className="mt-8 text-center text-white/10 font-black uppercase tracking-widest text-[8px]">
					Secure Verification Portal
				</div>
			</div>
		</div>
	);
};

export default Jackpot;
