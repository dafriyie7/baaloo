import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppcontext } from "../../context/AppContext";
import {
	LogOut,
	UserCog,
	LayoutDashboard,
	Layers2,
	QrCode,
	Users,
	Menu,
	X,
	Images,
	History,
} from "lucide-react";

const navLinks = [
	{ name: "Dashboard", path: "/admin", icon: LayoutDashboard },
	{ name: "Batches", path: "/admin/batches", icon: Layers2 },
	{ name: "Tickets", path: "/admin/codes", icon: QrCode },
	{ name: "SVGs", path: "/admin/svgs", icon: Images },
	{ name: "Scans", path: "/admin/players", icon: Users },
	{ name: "Activity Logs", path: "/admin/logs", icon: History },
];

function linkActive(pathname, linkPath) {
	if (pathname === linkPath) return true;
	if (linkPath === "/admin/batches" && pathname.startsWith("/admin/batches"))
		return true;
	if (linkPath === "/admin/codes" && pathname.startsWith("/admin/codes"))
		return true;
	if (linkPath === "/admin/players" && pathname.startsWith("/admin/players"))
		return true;
	if (linkPath === "/admin/svgs" && pathname.startsWith("/admin/svgs"))
		return true;
	if (linkPath === "/admin/logs" && pathname.startsWith("/admin/logs"))
		return true;
	return false;
}

/**
 * Admin chrome: left sidebar (desktop) / slide-over (mobile) + compact top bar on small screens.
 */
const AdminLayout = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { isLoggedIn, user, logout } = useAppcontext();
	const menuRef = useRef(null);

	const [mobileOpen, setMobileOpen] = useState(false);
	const [showAccountMenu, setShowAccountMenu] = useState(false);

	useEffect(() => {
		setMobileOpen(false);
	}, [location.pathname]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowAccountMenu(false);
			}
		};
		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setShowAccountMenu(false);
				setMobileOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const NavInner = ({ onNavigate } = {}) => (
		<div className="flex h-full min-h-0 flex-col">
			<Link
				to="/admin"
				onClick={onNavigate}
				className="mb-6 shrink-0 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-amber-50/80"
			>
				<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-200/80 bg-gradient-to-br from-amber-800 to-yellow-700 text-yellow-100 shadow-sm">
					<LayoutDashboard className="h-5 w-5" strokeWidth={2} />
				</span>
				<div>
					<h1 className="coiny text-lg font-bold leading-tight text-stone-900">
						Baaloo
					</h1>
					<p className="text-[10px] font-semibold uppercase tracking-widest text-amber-800/90">
						Admin
					</p>
				</div>
			</Link>

			<div
				className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-width:thin] [scrollbar-color:rgb(214_211_209)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-200/90"
			>
				<nav className="flex flex-col gap-1 pb-2" aria-label="Admin">
					{navLinks.map((link) => {
						const Icon = link.icon;
						const active = linkActive(location.pathname, link.path);
						return (
							<Link
								key={link.path}
								to={link.path}
								onClick={onNavigate}
								className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
									active
										? "bg-amber-100 text-amber-950 shadow-sm ring-1 ring-amber-200/80"
										: "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
								}`}
							>
								<Icon
									className={`h-5 w-5 shrink-0 ${active ? "text-amber-900" : "text-stone-500"}`}
									strokeWidth={2}
								/>
								{link.name}
							</Link>
						);
					})}
				</nav>
			</div>

			<div
				ref={menuRef}
				className="relative shrink-0 border-t border-amber-100/90 bg-white pt-4"
			>
				{isLoggedIn && user ? (
					<>
						<button
							type="button"
							onClick={() => setShowAccountMenu(!showAccountMenu)}
							className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-stone-100"
							aria-expanded={showAccountMenu}
							aria-haspopup="true"
						>
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-yellow-500 text-sm font-bold text-amber-950 ring-2 ring-amber-200/60">
								{user.name?.[0]?.toUpperCase() ?? "?"}
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-semibold text-stone-900">
									{user.name ?? "Account"}
								</p>
								<p className="truncate text-xs text-stone-500">Signed in</p>
							</div>
						</button>
						<div
							className={`absolute bottom-full left-0 right-0 z-20 mb-1 origin-bottom rounded-lg border border-amber-100 bg-white py-1 shadow-lg transition-all duration-200 ${
								showAccountMenu
									? "visible scale-100 opacity-100"
									: "invisible scale-95 opacity-0 pointer-events-none"
							}`}
						>
							<button
								type="button"
								onClick={() => {
									navigate("/admin/profile");
									setShowAccountMenu(false);
									onNavigate?.();
								}}
								className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50"
							>
								<UserCog size={16} className="text-amber-800" />
								My account
							</button>
							<button
								type="button"
								onClick={() => {
									handleLogout();
									onNavigate?.();
								}}
								className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
							>
								<LogOut size={16} />
								Log out
							</button>
						</div>
					</>
				) : (
					<button
						type="button"
						onClick={() => navigate("/login")}
						className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm hover:from-amber-400 hover:to-yellow-400"
					>
						Login
					</button>
				)}
			</div>
		</div>
	);

	return (
		<>
			{/* Mobile top bar */}
			<header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-amber-200/70 bg-white/95 px-4 shadow-sm backdrop-blur-md md:hidden">
				<button
					type="button"
					onClick={() => setMobileOpen(true)}
					className="rounded-md p-2 text-stone-700 hover:bg-amber-50"
					aria-label="Open menu"
				>
					<Menu className="h-6 w-6" strokeWidth={2} />
				</button>
				<span className="coiny text-lg font-bold text-amber-900">Baaloo</span>
				<span className="w-10" aria-hidden />
			</header>

			{/* Mobile overlay */}
			<div
				className={`fixed inset-0 z-40 bg-stone-900/40 transition-opacity md:hidden ${
					mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
				}`}
				aria-hidden
				onClick={() => setMobileOpen(false)}
			/>

			{/* Mobile drawer */}
			<aside
				className={`fixed left-0 top-0 z-50 flex h-full max-h-dvh w-[min(18rem,88vw)] flex-col border-r border-amber-100 bg-gradient-to-b from-white to-amber-50/40 px-4 pb-4 pt-14 shadow-xl transition-transform duration-300 ease-out md:hidden ${
					mobileOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<button
					type="button"
					onClick={() => setMobileOpen(false)}
					className="absolute right-3 top-3 z-10 rounded-md p-2 text-stone-600 hover:bg-white/80"
					aria-label="Close menu"
				>
					<X className="h-5 w-5" strokeWidth={2} />
				</button>
				<div className="flex min-h-0 flex-1 flex-col px-0 pb-2">
					<NavInner onNavigate={() => setMobileOpen(false)} />
				</div>
			</aside>

			{/* Desktop sidebar — full height, no scroll; account pinned to bottom */}
			<aside className="fixed left-0 top-0 z-30 hidden h-dvh max-h-dvh w-64 flex-col border-r border-amber-100/90 bg-gradient-to-b from-white via-white to-amber-50/30 px-4 pb-4 pt-6 shadow-sm md:flex">
				<div className="flex min-h-0 flex-1 flex-col">
					<NavInner />
				</div>
			</aside>
		</>
	);
};

export default AdminLayout;
