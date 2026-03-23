import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SCROLL_BLEND_RANGE = 96;

const Navbar = ({ navRef }) => {
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

	const solid = scrollBlend;
	const glass = 1 - scrollBlend;

	return (
		<nav
			ref={navRef}
			className="fixed top-0 left-0 z-50 flex w-full items-center justify-between px-4 py-2.5 transition-[padding,box-shadow,border-color] duration-300 md:px-12 md:py-3 lg:px-20"
			style={{
				backgroundColor: `rgba(250, 250, 249, ${0.38 * glass + 0.94 * solid})`,
				backdropFilter: `saturate(1.15) blur(${12 + solid * 8}px)`,
				WebkitBackdropFilter: `saturate(1.15) blur(${12 + solid * 8}px)`,
				borderBottom: `1px solid rgba(228, 228, 231, ${0.35 * glass + solid})`,
				boxShadow:
					solid > 0.85
						? "0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.08)"
						: "none",
			}}
		>
			<a href="/" className="flex min-w-0 items-center gap-2">
				<h1
					className="coiny truncate text-xl font-bold text-zinc-900 md:text-2xl lg:text-3xl"
					style={{
						textShadow:
							glass > 0.2
								? `0 1px 2px rgba(255,255,255,${0.65 * glass}), 0 0 1px rgba(0,0,0,${0.12 * glass})`
								: "none",
					}}
				>
					Baaloo
				</h1>
			</a>

			<div className="flex items-center gap-2 text-zinc-800 md:gap-4">
				<div className="rounded-md border border-zinc-400/55 px-2 py-0.5 text-xs font-bold text-zinc-800">
					18+
				</div>

				<div className="hidden items-center gap-4 md:flex lg:gap-8">
					{navLinks.map((link, i) => (
						<a
							key={i}
							href={link.path}
							className="group flex flex-col gap-0.5 text-sm font-medium text-zinc-800"
						>
							{link.name}
							<div
								className={`h-0.5 bg-zinc-600 ${
									location.pathname === link.path
										? "w-full"
										: "w-0"
								} transition-all duration-300 group-hover:w-full`}
							/>
						</a>
					))}
					<button
						type="button"
						onClick={() => navigate("/how-to-play")}
						className="rounded-full border border-zinc-400/80 px-4 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100/90"
					>
						How to play
					</button>
				</div>
			</div>

			<div className="flex items-center gap-3 md:hidden">
				<button
					type="button"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					className="p-1 text-zinc-800"
					aria-label="Menu"
				>
					<svg
						className="h-6 w-6"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						viewBox="0 0 24 24"
					>
						<line x1="4" y1="6" x2="20" y2="6" />
						<line x1="4" y1="12" x2="20" y2="12" />
						<line x1="4" y1="18" x2="20" y2="18" />
					</svg>
				</button>
			</div>

			<div
				className={`fixed left-0 top-0 flex h-screen w-full flex-col items-center justify-center gap-6 bg-zinc-50 text-base font-medium text-zinc-800 transition-transform duration-500 md:hidden ${
					isMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<button
					type="button"
					className="absolute right-4 top-4 text-zinc-700"
					onClick={() => setIsMenuOpen(false)}
					aria-label="Close menu"
				>
					<svg
						className="h-6 w-6"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						viewBox="0 0 24 24"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>

				{navLinks.map((link, i) => (
					<a
						key={i}
						href={link.path}
						onClick={() => setIsMenuOpen(false)}
						className={
							location.pathname === link.path
								? "border-b-2 border-zinc-700"
								: ""
						}
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
					className="rounded-full border-2 border-zinc-400 px-8 py-2.5 text-zinc-900 hover:bg-zinc-100"
				>
					How to play
				</button>
			</div>
		</nav>
	);
};

export default Navbar;
