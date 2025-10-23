import { useNavigate } from "react-router-dom";
import { Frown } from "lucide-react";

const NotFound = () => {
	const navigate = useNavigate();

	return (
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
			<Frown className="w-24 h-24 text-slate-400 mb-4" />
			<h1 className="text-6xl font-bold text-slate-800">404</h1>
			<h2 className="text-2xl font-semibold text-slate-600 mt-2 mb-4">
				Page Not Found
			</h2>
			<p className="text-slate-500 mb-8 max-w-sm">
				Sorry, the page you are looking for does not exist. It might
				have been moved or deleted.
			</p>
			<button
				onClick={() => navigate("/")}
				className="py-3 px-8 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105"
			>
				Go to Homepage
			</button>
		</div>
	);
};

export default NotFound;
