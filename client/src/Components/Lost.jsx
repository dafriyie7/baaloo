import React from 'react';
import { XCircle, RefreshCw } from 'lucide-react';

const Lost = ({ message, onRetry, onHome }) => {
	return (
		<div className="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 px-4 py-12 relative overflow-hidden">
			{/* Background shapes */}
			<div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-200/50 blur-[100px]" aria-hidden />
			
			<div className="w-full max-w-md relative z-10 text-center">
				<div className="mb-8 flex justify-center">
					<div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 border-4 border-white shadow-md">
						<XCircle className="h-12 w-12 text-zinc-400" strokeWidth={2.5} />
					</div>
				</div>

				<div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-zinc-500 shadow-sm mb-4">
					Not a Winner
				</div>
				
				<h1 className="text-4xl font-black text-zinc-900 mb-4">
					So Close!
				</h1>
				<p className="text-lg text-zinc-600 font-medium mb-10 max-w-xs mx-auto">
					{message || "Sorry, this ticket is not a winner. Don't give up, better luck next time!"}
				</p>

				<div className="flex flex-col gap-3">
					{onRetry && (
						<button 
							onClick={onRetry}
							className="group flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98]"
						>
							<RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180 duration-500" />
							Play Again
						</button>
					)}
					{onHome && (
						<button 
							onClick={onHome}
							className="w-full rounded-full py-4 text-sm font-bold text-zinc-500 transition-colors hover:bg-white hover:text-zinc-800 shadow-sm border border-transparent hover:border-zinc-200"
						>
							Return Home
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Lost;
