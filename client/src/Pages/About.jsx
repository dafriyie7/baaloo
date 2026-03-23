import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Shield, HeartHandshake } from "lucide-react";

const About = () => {
	const navigate = useNavigate();

	return (
		<div className="relative min-h-screen overflow-hidden bg-zinc-50 px-4 py-36 text-zinc-900 md:py-48">
			{/* Ambient glows */}
			<div className="absolute left-0 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/30 blur-[120px]" aria-hidden />
			<div className="absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-amber-200/40 blur-[100px]" aria-hidden />

			<div className="relative z-10 mx-auto w-full max-w-3xl">
				<div className="text-center">
					<p className="inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-600 shadow-sm">
						The Baaloo Story
					</p>
					<h1 className="mt-6 text-4xl font-black text-zinc-900 md:text-6xl">
						About us
					</h1>
					<p className="mx-auto mt-6 max-w-xl text-lg font-medium text-zinc-500">
						Instant scratch-and-win, built to be simple, fast, and fair.
					</p>
				</div>

				<div className="mt-16 overflow-hidden rounded-[2rem] border border-amber-200/50 bg-white/80 p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-xl md:p-10">
					<section className="group relative transition-all duration-300">
						<div className="flex items-center gap-4 text-orange-600">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 ring-1 ring-orange-200/60 transition-colors group-hover:bg-orange-100 group-hover:ring-orange-300">
								<Sparkles className="h-6 w-6" strokeWidth={2.5} />
							</div>
							<h2 className="text-2xl font-bold text-zinc-900 transition-colors group-hover:text-amber-900">
								What we do
							</h2>
						</div>
						<p className="mt-5 text-base font-medium leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-600">
							Baaloo is a digital scratch experience. You enter a
							few details, scan the QR code on your physical card,
							and get an immediate result. Winners see a
							confirmation screen with their information so prizes
							can be handled smoothly.
						</p>
					</section>

					<div className="my-8 h-px bg-zinc-200" />

					<section className="group relative transition-all duration-300">
						<div className="flex items-center gap-4 text-orange-600">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 ring-1 ring-orange-200/60 transition-colors group-hover:bg-orange-100 group-hover:ring-orange-300">
								<Shield className="h-6 w-6" strokeWidth={2.5} />
							</div>
							<h2 className="text-2xl font-bold text-zinc-900 transition-colors group-hover:text-amber-900">
								Play responsibly
							</h2>
						</div>
						<p className="mt-5 text-base font-medium leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-600">
							Baaloo is for adults{" "}
							<span className="font-bold text-amber-600">
								18+
							</span>{" "}
							only. Please read the rules on your promotion
							materials and only participate if you&apos;re
							comfortable doing so. If you ever need a break from
							gaming, seek support from local responsible-gambling
							resources.
						</p>
					</section>

					<div className="my-8 h-px bg-zinc-200" />

					<section className="group relative transition-all duration-300">
						<div className="flex items-center gap-4 text-orange-600">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 ring-1 ring-orange-200/60 transition-colors group-hover:bg-orange-100 group-hover:ring-orange-300">
								<HeartHandshake className="h-6 w-6" strokeWidth={2.5} />
							</div>
							<h2 className="text-2xl font-bold text-zinc-900 transition-colors group-hover:text-amber-900">
								Your information
							</h2>
						</div>
						<p className="mt-5 text-base font-medium leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-600">
							We ask for your name and phone number so entries are
							unique and we can contact winners. Use the same
							details you&apos;d expect us to reach you on if you
							win. For full privacy terms, refer to your campaign
							operator or official Baaloo documentation when
							published.
						</p>
					</section>
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
						onClick={() => navigate("/how-to-play")}
						className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-10 py-4 text-lg font-bold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 hover:shadow active:scale-95 sm:w-auto"
					>
						How to play
					</button>
				</div>
			</div>
		</div>
	);
};

export default About;
