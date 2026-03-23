import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SCROLL_BLEND_RANGE = 96;

const Navbar = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const navLinks = [{ name: "About", path: "/about" }];

	const [scrollBlend, setScrollBlend] = useState(0);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const y = window.scrollY;
			const t = Math.min(1, Math.max(0, y / SCROLL_BLEND_RANGE));
			setScrollBlend(t);
		};
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<nav
			className={`fixed left-1/2 z-50 flex w-[95%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full bg-zinc-950/80 px-5 py-3 backdrop-blur-xl transition-all duration-500 md:px-8 md:py-3.5 ${
				scrollBlend > 0.5 
					? 'top-2 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/20' 
					: 'top-6 shadow-lg shadow-black/20 border border-white/10'
			}`}
		>
			<a href="/" className="flex min-w-0 items-center gap-3">
				<h1 className="coiny truncate text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent drop-shadow-sm md:text-3xl">
					Baaloo
				</h1>
				<div className="hidden sm:flex rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 uppercase tracking-widest border border-orange-500/20">
					18+ Only
				</div>
			</a>

			<div className="flex items-center gap-3 md:gap-6">
				<div className="hidden items-center gap-6 md:flex lg:gap-8">
					{navLinks.map((link, i) => (
						<a
							key={i}
							href={link.path}
							className={`relative text-sm font-semibold transition-colors hover:text-white ${
								location.pathname === link.path ? "text-white" : "text-zinc-400"
							}`}
						>
							{link.name}
							{location.pathname === link.path && (
								<div className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-orange-500" />
							)}
						</a>
					))}
					<button
						type="button"
						onClick={() => navigate("/how-to-play")}
						className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-900 shadow-md shadow-white/10 transition-all hover:scale-105 hover:bg-zinc-200 active:scale-95"
					>
						How to play
					</button>
				</div>
			</div>

			<div className="flex items-center gap-3 md:hidden">
				<button
					type="button"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					className="p-1.5 text-zinc-300 transition-transform active:scale-90"
					aria-label="Menu"
				>
					<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
						<line x1="4" y1="6" x2="20" y2="6" />
						<line x1="4" y1="12" x2="20" y2="12" />
						<line x1="4" y1="18" x2="20" y2="18" />
					</svg>
				</button>
			</div>

			{/* Mobile menu overlay */}
			<div className={`fixed inset-0 -z-10 bg-zinc-950/60 backdrop-blur-md transition-opacity duration-300 md:hidden ${isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setIsMenuOpen(false)} />

			<div className={`absolute right-0 top-[110%] flex w-[calc(100vw-2.5rem)] flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 md:hidden origin-top-right ${
					isMenuOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
				}`}
			>
				{navLinks.map((link, i) => (
					<a
						key={i}
						href={link.path}
						onClick={() => setIsMenuOpen(false)}
						className={`text-lg font-bold px-2 py-1 ${
							location.pathname === link.path ? "text-orange-400" : "text-zinc-300"
						}`}
					>
						{link.name}
					</a>
				))}

				<button
					type="button"
					onClick={() => {
						navigate("/how-to-play");
						setIsMenuOpen(false);
					}}
					className="mt-2 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-orange-500/25 active:scale-95 transition-transform"
				>
					How to play
				</button>
			</div>
		</nav>
	);
};

export default Navbar;
