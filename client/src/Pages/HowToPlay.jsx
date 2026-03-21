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
		<div className="w-full min-h-screen bg-gradient-to-br from-orange-950 via-stone-900 to-orange-950 text-stone-300 px-4 py-10 md:py-14">
			<div className="mx-auto w-full max-w-2xl">
				<p className="text-center font-bold text-orange-400 coiny text-xl md:text-2xl">
					Baaloo
				</p>
				<h1 className="mt-2 text-center text-3xl font-bold text-white md:text-4xl">
					How to play
				</h1>
				<p className="mx-auto mt-3 max-w-lg text-center text-stone-400">
					Four quick steps from your couch to your result — scratch,
					scan, and see if luck is on your side.
				</p>

				<div className="mt-10 space-y-5 rounded-2xl border border-orange-500/20 bg-white/5 p-6 shadow-xl backdrop-blur-sm md:p-8">
					{steps.map((step, index) => {
						const Icon = step.icon;
						return (
							<div
								key={step.title}
								className="flex flex-col gap-4 border-b border-orange-900/40 pb-5 last:border-0 last:pb-0 md:flex-row md:items-start"
							>
								<div className="flex shrink-0 items-center gap-3 md:flex-col md:items-center">
									<span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
										{index + 1}
									</span>
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-950/80 ring-1 ring-orange-500/30">
										<Icon
											className="text-orange-300"
											size={28}
											strokeWidth={2}
										/>
									</div>
								</div>
								<div className="min-w-0 flex-1">
									<h2 className="text-lg font-semibold text-white md:text-xl">
										{step.title}
									</h2>
									<p className="mt-1.5 text-sm leading-relaxed text-stone-400 md:text-base">
										{step.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>

				<div className="mt-8 rounded-2xl border border-orange-500/15 bg-orange-950/40 p-6 md:p-7">
					<div className="flex items-center gap-2 text-orange-200">
						<Lightbulb className="h-5 w-5 shrink-0" />
						<h2 className="font-semibold text-white">
							Helpful tips
						</h2>
					</div>
					<ul className="mt-4 list-inside list-disc space-y-2 text-sm text-stone-400 md:text-base">
						{tips.map((t) => (
							<li key={t} className="leading-relaxed">
								{t}
							</li>
						))}
					</ul>
				</div>

				<div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
					<button
						type="button"
						onClick={() => navigate("/")}
						className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-orange-500 sm:w-auto"
					>
						<ArrowLeft size={18} />
						Play now
					</button>
					<button
						type="button"
						onClick={() => navigate("/about")}
						className="inline-flex w-full items-center justify-center rounded-full border border-orange-400/40 px-8 py-3.5 text-base font-medium text-orange-100 transition hover:bg-white/5 sm:w-auto"
					>
						About Baaloo
					</button>
				</div>
			</div>
		</div>
	);
};

export default HowToPlay;
