import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
	return (
		<div className="min-h-screen flex flex-col bg-gray-100">
			{/* Fixed navbar at the top */}
			<Navbar />

			{/* Main content area */}
			<main className="flex-1 pt-22">
				<Outlet />
			</main>

			{/* <footer className="p-4 text-center text-sm text-gray-500">
				© {new Date().getFullYear()} Baaloo
			</footer> */}
		</div>
	);
};

export default Layout;
