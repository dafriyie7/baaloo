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

	const steps = [
		{
			icon: <Smartphone size={32} className="text-slate-300" />,
			title: "Enter Your Details",
			description:
				"Start by entering your name and a valid 10-digit phone number. This is how we'll contact you if you win!",
		},
		{
			icon: <ScanLine size={32} className="text-slate-300" />,
			title: "Scan Your QR Code",
			description:
				"Use your device's camera to scan the unique QR code on your scratch card. You can also upload an image of the code.",
		},
		{
			icon: <Gift size={32} className="text-slate-300" />,
			title: "Check Your Result",
			description:
				"The system will instantly check your code and let you know if you're a lucky winner.",
		},
		{
			icon: <PartyPopper size={32} className="text-slate-300" />,
			title: "Claim Your Prize!",
			description:
				"If you win, you'll be directed to a prize page with all the details. We will contact you shortly to arrange your reward.",
		},
	];

	return (
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-300 px-4 py-8">
			<div className="w-full max-w-2xl bg-slate-200/10 backdrop-blur-lg border border-slate-400/20 p-8 rounded-2xl shadow-2xl">
				<h1 className="text-4xl font-bold text-white text-center mb-8">
					How to Play
				</h1>
				<div className="space-y-6">
					{steps.map((step, index) => (
						<div key={index} className="flex flex-col md:flex-row items-center md:items-start md:gap-6">
							<div className="flex-shrink-0 bg-slate-800/50 p-4 rounded-full">
								{step.icon}
							</div>
							<div>
								<h3 className="text-xl font-semibold w-full flex max-sm:justify-center text-white">
									{step.title}
								</h3>
								<p className="text-slate-400 mt-1">
									{step.description}
								</p>
							</div>
						</div>
					))}
				</div>
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
