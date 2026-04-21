import React from 'react';
import { Hammer, Clock, ShieldCheck } from 'lucide-react';

const Maintenance = () => {
	return (
		<div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 px-4 text-center">
			<div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/30 blur-[100px]" aria-hidden />
			
			<div className="relative mb-8">
				<div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-900 text-white shadow-2xl">
					<Hammer size={48} className="animate-bounce" />
				</div>
				<div className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
					<Clock size={20} />
				</div>
			</div>

			<h1 className="text-4xl font-black text-zinc-900 md:text-5xl">
				Be Right Back!
			</h1>
			<p className="mt-4 max-w-md text-lg font-medium text-zinc-500">
				Baaloo is currently undergoing routine maintenance to improve your experience. We&apos;ll be back online very soon.
			</p>

			<div className="mt-10 flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 shadow-sm border border-zinc-100">
				<ShieldCheck size={16} className="text-orange-500" />
				Secure Maintenance in Progress
			</div>

			<div className="mt-16 text-sm font-bold text-zinc-400">
				&copy; {new Date().getFullYear()} Baaloo Systems
			</div>
		</div>
	);
};

export default Maintenance;
