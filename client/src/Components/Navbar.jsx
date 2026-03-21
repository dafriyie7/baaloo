import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = ({ navRef }) => {
	const navigate = useNavigate();
	const location = useLocation();

	const navLinks = [{ name: "About", path: "/about" }];

	const [isScrolled, setIsScrolled] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<nav
			ref={navRef}
			className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-12 lg:px-20 transition-all duration-500 z-50 ${
				isScrolled
					? "bg-white/95 shadow-md text-gray-800 backdrop-blur-lg py-2 md:py-3"
					: "bg-orange-950/95 text-white py-3 md:py-4 backdrop-blur-sm"
			}`}
		>
			<a href="/" className="flex items-center gap-2 min-w-0">
				<h1
					className={`text-xl md:text-2xl lg:text-3xl font-bold coiny truncate ${
						isScrolled ? "text-orange-600" : "text-white"
					}`}
				>
					Baaloo
				</h1>
			</a>

			<div
				className={`flex items-center gap-2 md:gap-4 ${
					isScrolled ? "text-gray-800" : "text-white"
				}`}
			>
				<div
					className={`rounded-md border-2 px-2 py-0.5 text-xs font-bold ${
						isScrolled
							? "border-orange-500 text-orange-700"
							: "border-orange-300 text-orange-100"
					}`}
				>
					18+
				</div>

				<div className="hidden md:flex items-center gap-4 lg:gap-8">
					{navLinks.map((link, i) => (
						<a
							key={i}
							href={link.path}
							className="group flex flex-col gap-0.5 font-medium text-sm"
						>
							{link.name}
							<div
								className={`h-0.5 ${
									isScrolled ? "bg-orange-600" : "bg-white"
								} ${
									location.pathname === link.path
										? "w-full"
										: "w-0"
								} group-hover:w-full transition-all duration-300`}
							/>
						</a>
					))}
					<button
						type="button"
						onClick={() => navigate("/how-to-play")}
						className={`text-sm font-medium rounded-full border px-4 py-1.5 transition-colors ${
							isScrolled
								? "border-orange-600 text-orange-800 hover:bg-orange-50"
								: "border-white/80 text-white hover:bg-white/10"
						}`}
					>
						How to play
					</button>
				</div>
			</div>

			<div className="flex items-center gap-3 md:hidden">
				<button
					type="button"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					className="p-1"
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
				className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${
					isMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<button
					type="button"
					className="absolute top-4 right-4"
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
								? "border-b-2 border-orange-600"
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
					className="text-orange-800 border border-orange-600 px-8 py-2.5 rounded-full"
				>
					How to play
				</button>
			</div>
		</nav>
	);
};

export default Navbar;
