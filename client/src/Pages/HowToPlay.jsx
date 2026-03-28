import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ScanLine,
	Smartphone,
	Gift,
	PartyPopper,
	Lightbulb,
} from "lucide-react";

const HowToPlay = () => {
	const navigate = useNavigate();

	const steps = [
		{
			icon: Smartphone,
			title: "Enter your details",
			description:
				"Start with your full name and a valid 10-digit phone number. We use this to record your entry and reach you if you win.",
		},
		{
			icon: ScanLine,
			title: "Scan your QR code",
			description:
				"Allow camera access, then point at the QR on your Baaloo scratch card. You can also tap “Upload an image” and choose a clear photo of the code.",
		},
		{
			icon: Gift,
			title: "See your result",
			description:
				"We validate your code right away. You’ll know on the spot whether you’ve won.",
		},
		{
			icon: PartyPopper,
			title: "Claim your prize",
			description:
				"If you’re a winner, you’ll be taken to a summary page with your details. Our team will follow up with next steps for your reward.",
		},
	];

	const tips = [
		"Use good lighting and hold the QR steady if the camera struggles.",
		"One entry per code — keep your card until the promotion ends if rules require it.",
		"You must be 18 or older to play.",
	];

	return (
		<div className="relative min-h-screen overflow-hidden bg-zinc-50 px-4 py-36 text-zinc-900 md:py-48">
			{/* Ambient glows */}
			<div className="absolute left-0 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/30 blur-[120px]" aria-hidden />
			<div className="absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-amber-200/40 blur-[100px]" aria-hidden />

			<div className="relative z-10 mx-auto w-full max-w-3xl">
				<div className="text-center">
					<p className="inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-600 shadow-sm">
						Tutorial
					</p>
					<h1 className="mt-6 text-[clamp(2.5rem,6vw,4rem)] leading-tight font-black text-zinc-900">
						How to play
					</h1>
					<p className="mx-auto mt-6 max-w-xl text-lg font-medium text-zinc-500">
						Four quick steps from your couch to your result — scratch,
						scan, and see if luck is on your side.
					</p>
				</div>

				<div className="mt-16 space-y-6">
					{steps.map((step, index) => {
						const Icon = step.icon;
						return (
							<div
								key={step.title}
								className="group relative overflow-hidden rounded-[2rem] border border-amber-200/40 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-2xl hover:shadow-orange-900/10 md:p-8"
							>
								<div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
									<div className="flex shrink-0 items-center justify-between md:flex-col md:items-center md:gap-4">
										<span className="text-5xl font-black text-zinc-200 transition-colors group-hover:text-orange-200">
											0{index + 1}
										</span>
										<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 ring-1 ring-orange-200/60 transition-colors group-hover:bg-orange-100 group-hover:ring-orange-300">
											<Icon className="h-7 w-7 text-orange-600 fade-in" strokeWidth={2.5} />
										</div>
									</div>
									<div className="min-w-0 flex-1 pt-2">
										<h2 className="text-2xl font-bold text-zinc-900 transition-colors">
											{step.title}
										</h2>
										<p className="mt-3 text-base font-medium leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-600">
											{step.description}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div className="mt-12 overflow-hidden rounded-[2rem] border border-amber-200/40 bg-orange-50/50 p-8 shadow-inner backdrop-blur-md">
					<div className="flex items-center gap-3 text-orange-600">
						<Lightbulb className="h-6 w-6 shrink-0" strokeWidth={2.5} />
						<h2 className="text-xl font-bold text-zinc-900">
							Helpful tips
						</h2>
					</div>
					<ul className="mt-6 list-inside list-disc space-y-3 text-base font-medium text-zinc-600">
						{tips.map((t) => (
							<li key={t} className="leading-relaxed marker:text-orange-500">
								{t}
							</li>
						))}
					</ul>
				</div>

				<div className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
					<button
						type="button"
						onClick={() => navigate("/")}
						className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-zinc-900 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-zinc-900/20 transition-all hover:scale-105 hover:bg-zinc-800 hover:shadow-2xl active:scale-95 sm:w-auto"
					>
						<ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
						Play now
					</button>
					<button
						type="button"
						onClick={() => navigate("/about")}
						className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-10 py-4 text-lg font-bold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 hover:shadow active:scale-95 sm:w-auto"
					>
						About Baaloo
					</button>
				</div>
			</div>
		</div>
	);
};

export default HowToPlay;
