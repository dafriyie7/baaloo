import { useState, useRef, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import AdminNavbar from "./admin/AdminNavbar";

const Layout = () => {
	const [navHeight, setNavHeight] = useState(0);
	const navRef = useRef(null);
	const location = useLocation()

	useLayoutEffect(() => {
		if (!navRef.current) return;

		const resizeObserver = new ResizeObserver(() => {
			setNavHeight(navRef.current.offsetHeight);
		});

		resizeObserver.observe(navRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	return (
		<div className="min-h-screen flex flex-col bg-gray-100">
			{location.pathname.includes("/admin") ? (
				<AdminNavbar navRef={navRef}/>
			) : (
				<Navbar navRef={navRef} />
			)}

			{/* Main content area */}
			<main className="flex-1" style={{ paddingTop: `${navHeight}px` }}>
				<Outlet />
			</main>
		</div>
	);
};

export default Layout;
