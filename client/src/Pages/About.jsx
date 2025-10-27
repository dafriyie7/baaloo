import React from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ScanLine,
	Smartphone,
	Gift,
	PartyPopper,
} from "lucide-react";

const About = () => {
	const navigate = useNavigate();

	return (
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-300 px-4 py-8">
			<div className="w-full max-w-2xl bg-slate-200/10 backdrop-blur-lg border border-slate-400/20 p-8 rounded-2xl shadow-2xl">
				<h1 className="text-4xl font-bold text-white text-center mb-8">
					About Baaloo
				</h1>
				<div className="mt-10 text-center">
					<button
						onClick={() => navigate("/")}
						className="inline-flex items-center gap-2 py-3 px-8 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105"
					>
						<ArrowLeft size={18} />
						Play Now
					</button>
				</div>
			</div>
		</div>
	);
};

export default About;
