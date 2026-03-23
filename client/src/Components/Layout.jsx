import { useState, useRef, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import AdminLayout from "./admin/AdminLayout";

const Layout = () => {
	const [navHeight, setNavHeight] = useState(0);
	const navRef = useRef(null);
	const location = useLocation();

	const isAdmin = location.pathname.includes("/admin");

	useLayoutEffect(() => {
		if (isAdmin) {
			setNavHeight(0);
			document.documentElement.style.setProperty("--app-nav-height", "0px");
			return undefined;
		}

		const el = navRef.current;
		if (!el) return undefined;

		const resizeObserver = new ResizeObserver(() => {
			const h = el.offsetHeight;
			setNavHeight(h);
			document.documentElement.style.setProperty("--app-nav-height", `${h}px`);
		});

		resizeObserver.observe(el);
		const h = el.offsetHeight;
		setNavHeight(h);
		document.documentElement.style.setProperty("--app-nav-height", `${h}px`);

		return () => resizeObserver.disconnect();
	}, [isAdmin, location.pathname]);

	return (
		<div
			className={`min-h-screen flex flex-col ${
				isAdmin
					? "bg-gradient-to-b from-stone-100 via-amber-50/20 to-stone-100"
					: "bg-gray-100"
			}`}
		>
			{isAdmin ? <AdminLayout /> : <Navbar navRef={navRef} />}

			<main
				className={`flex-1 ${isAdmin ? "pt-14 md:pt-0 md:pl-64" : ""}`}
				style={!isAdmin ? { paddingTop: `${navHeight}px` } : undefined}
			>
				<Outlet />
			</main>
		</div>
	);
};

export default Layout;
