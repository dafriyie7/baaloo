import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Shield, HeartHandshake } from "lucide-react";

const About = () => {
	const navigate = useNavigate();

	return (
		<div className="w-full min-h-screen bg-gradient-to-br from-orange-950 via-stone-900 to-orange-950 text-stone-300 px-4 py-10 md:py-14">
			<div className="mx-auto w-full max-w-2xl">
				<p className="text-center font-bold text-orange-400 coiny text-2xl md:text-3xl">
					Baaloo
				</p>
				<h1 className="mt-2 text-center text-3xl font-bold text-white md:text-4xl">
					About us
				</h1>
				<p className="mx-auto mt-3 max-w-lg text-center text-lg text-stone-400">
					Instant scratch-and-win, built to be simple, fast, and fair.
				</p>

				<div className="mt-10 space-y-6 rounded-2xl border border-orange-500/20 bg-white/5 p-6 shadow-xl backdrop-blur-sm md:p-8">
					<section>
						<div className="flex items-center gap-2 text-orange-300">
							<Sparkles className="h-5 w-5" strokeWidth={2} />
							<h2 className="text-lg font-semibold text-white">
								What we do
							</h2>
						</div>
						<p className="mt-3 text-sm leading-relaxed text-stone-400 md:text-base">
							Baaloo is a digital scratch experience. You enter a
							few details, scan the QR code on your physical card,
							and get an immediate result. Winners see a
							confirmation screen with their information so prizes
							can be handled smoothly.
						</p>
					</section>

					<section className="border-t border-orange-900/40 pt-6">
						<div className="flex items-center gap-2 text-orange-300">
							<Shield className="h-5 w-5" strokeWidth={2} />
							<h2 className="text-lg font-semibold text-white">
								Play responsibly
							</h2>
						</div>
						<p className="mt-3 text-sm leading-relaxed text-stone-400 md:text-base">
							Baaloo is for adults{" "}
							<span className="font-medium text-orange-200">
								18+
							</span>{" "}
							only. Please read the rules on your promotion
							materials and only participate if you&apos;re
							comfortable doing so. If you ever need a break from
							gaming, seek support from local responsible-gambling
							resources.
						</p>
					</section>

					<section className="border-t border-orange-900/40 pt-6">
						<div className="flex items-center gap-2 text-orange-300">
							<HeartHandshake className="h-5 w-5" strokeWidth={2} />
							<h2 className="text-lg font-semibold text-white">
								Your information
							</h2>
						</div>
						<p className="mt-3 text-sm leading-relaxed text-stone-400 md:text-base">
							We ask for your name and phone number so entries are
							unique and we can contact winners. Use the same
							details you&apos;d expect us to reach you on if you
							win. For full privacy terms, refer to your campaign
							operator or official Baaloo documentation when
							published.
						</p>
					</section>
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
						onClick={() => navigate("/how-to-play")}
						className="inline-flex w-full items-center justify-center rounded-full border border-orange-400/40 px-8 py-3.5 text-base font-medium text-orange-100 transition hover:bg-white/5 sm:w-auto"
					>
						How to play
					</button>
				</div>
			</div>
		</div>
	);
};

export default About;
