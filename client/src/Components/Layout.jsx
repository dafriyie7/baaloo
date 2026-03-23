import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import AdminLayout from "./admin/AdminLayout";

const Layout = () => {
	const location = useLocation();
	const isAdmin = location.pathname.includes("/admin");

	return (
		<div
			className={`min-h-screen flex flex-col ${
				isAdmin
					? "bg-gradient-to-b from-stone-100 via-amber-50/20 to-stone-100"
					: "bg-zinc-50"
			}`}
		>
			{isAdmin ? <AdminLayout /> : <Navbar />}

			<main
				className={`flex-1 ${isAdmin ? "pt-14 md:pt-0 md:pl-64" : ""}`}
			>
				<Outlet />
			</main>
		</div>
	);
};

export default Layout;
