import {
	useEffect,
	useState,
	useRef,
	forwardRef,
	useImperativeHandle,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppcontext } from "../../context/AppContext";
import { LogOut, UserCog } from "lucide-react";

const AdminNavbar = forwardRef(({ navRef: propNavRef }, ref) => {
	const navigate = useNavigate();
	const location = useLocation();
	const menuRef = useRef(null);
	const { isLoggedIn, user, logout } = useAppcontext();

	const [showAccountMenu, setShowAccountMenu] = useState(false);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const navLinks = [
		{ name: "Players", path: "/admin/players" },
		{ name: "Codes", path: "/admin/codes" },
	];

	const [isScrolled, setIsScrolled] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowAccountMenu(false);
			}
		};
		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setShowAccountMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	useImperativeHandle(ref, () => propNavRef.current);

	return (
		<nav
			ref={propNavRef}
			className={`fixed top-0 left-0 bg-slate-900 w-full flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 transition-all duration-75 z-50 ${
				isScrolled
					? "bg-white/80 shadow-md text-gray-700 backdrop-blur-lg py-3 md:py-4"
					: "py-4 md:py-6"
			}`}
		>
			{/* Logo */}
			<a href="/" className="flex items-center gap-2">
				<h1
					className={`text-xl md:text-2xl lg:text-3xl font-bold coiny ${
						isScrolled ? "text-black" : "text-white"
					}`}
				>
					Baaloo
				</h1>
			</a>

			{/* Desktop Nav */}
			<div className="hidden md:flex items-center gap-4 lg:gap-8">
				{navLinks.map(
					(
						link,
						i // Changed <a> to <Link>
					) => (
						<Link
							key={i}
							to={link.path}
							className={`group flex flex-col gap-0.5 ${
								isScrolled ? "text-gray-700" : "text-white"
							}`}
						>
							{link.name}
							<div
								className={`${
									isScrolled ? "bg-gray-700" : "bg-white"
								} h-0.5 ${
									location.pathname === link.path
										? "w-full"
										: "w-0"
								} group-hover:w-full transition-all duration-300`}
							/>
						</Link>
					)
				)}{" "}
				{/* Changed <a> to <Link> */}
				<button
					onClick={() => navigate("/admin")}
					className={`border px-4 py-1 text-sm font-light rounded-full cursor-pointer ${
						isScrolled ? "text-black" : "text-white"
					} transition-all`}
				>
					Manage
				</button>
			</div>

			{/* Desktop Right */}
			<div
				ref={menuRef}
				className="hidden md:flex items-center gap-4 relative"
			>
				{isLoggedIn && user ? (
					<>
						<button
							onClick={() => setShowAccountMenu(!showAccountMenu)}
							className={`py-2.5 px-4 rounded-full ml-4 transition-all duration-500 cursor-pointer font-bold flex items-center justify-center ${
								isScrolled
									? "text-white bg-black"
									: "bg-white text-black"
							}`}
						>
							{user.name[0].toUpperCase()}
						</button>
						<div
							className={`absolute top-full right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg py-1 z-20 transition-all duration-200 ease-out ${
								showAccountMenu
									? "opacity-100 scale-100"
									: "opacity-0 scale-95 pointer-events-none"
							}`}
						>
							<button
								onClick={() => navigate("/admin/profile")}
								className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
							>
								<UserCog size={16} />
								<span>My Account</span>
							</button>
							<button
								onClick={handleLogout}
								className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
							>
								<LogOut size={16} />
								<span>Logout</span>
							</button>
						</div>
					</>
				) : (
					<button onClick={() => navigate("/login")}>Login</button>
				)}
			</div>

			{/* Mobile Menu Button */}
			<div className="flex items-center gap-3 md:hidden">
				<svg
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					className={`h-6 w-6 cursor-pointer ${
						isScrolled ? "text-slate-800" : "text-white"
					}`}
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					viewBox="0 0 24 24"
				>
					<line x1="4" y1="6" x2="20" y2="6" />
					<line x1="4" y1="12" x2="20" y2="12" />
					<line x1="4" y1="18" x2="20" y2="18" />
				</svg>
			</div>

			{/* Mobile Menu */}
			<div
				className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${
					isMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<button
					className="absolute top-4 right-4"
					onClick={() => setIsMenuOpen(false)}
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
					<Link // Changed <a> to <Link>
						key={i}
						to={link.path}
						onClick={() => setIsMenuOpen(false)}
						className={`${
							location.pathname === link.path
								? "border-b-2 border-black"
								: ""
						}`}
					>
						{" "}
						{/* Changed <a> to <Link> */}
						{link.name}
					</Link>
				))}

				<button
					onClick={() => {
						navigate("/admin");
						setIsMenuOpen(false);
					}}
					className="border px-4 py-1 text-sm font-light rounded-full cursor-pointer transition-all"
				>
					Manage
				</button>

				<button
					onClick={() => {
						isLoggedIn
							? navigate("/admin/profile")
							: navigate("/login");
						setIsMenuOpen(false);
					}}
					className="bg-black text-white px-8 py-2.5 rounded-full transition-all duration-500"
				>
					{isLoggedIn ? user.name : "Login"}
				</button>
				{isLoggedIn && (
					<button
						onClick={() => {
							handleLogout();
							setIsMenuOpen(false);
						}}
						className="flex items-center gap-2 text-sm font-medium text-red-600"
					>
						<LogOut size={16} />
						<span>Logout</span>
					</button>
				)}
			</div>
		</nav>
	);
});

export default AdminNavbar;
