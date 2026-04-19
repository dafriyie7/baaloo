import { useState, useRef, useEffect } from "react";
import { 
	QrCode, 
	UserPlus, 
	Sparkles, 
	Trophy, 
	ChevronDown 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppcontext } from "../context/AppContext";
import { AlertTriangle } from "lucide-react";

const PLAYER_STEPS = [
	{
		title: "Enter your details",
		description: "Add your name and a valid phone number so we can record your entry.",
		icon: UserPlus,
	},
	{
		title: "Scan your code",
		description: "Use your camera to scan the QR on your Baaloo scratch card, or upload a clear photo.",
		icon: QrCode,
	},
	{
		title: "See if you won",
		description: "We validate your code instantly and let you know if you’re a winner.",
		icon: Sparkles,
	},
	{
		title: "Claim your prize",
		description: "If you win, follow the prompts to claim — non-winners can try again next time.",
		icon: Trophy,
	},
];

const FAQ_ITEMS = [
	{
		title: "What is Baaloo?",
		content: "Baaloo is an instant scratch-and-win experience. Enter your details, scan the code on your card, and find out right away if you’ve won a prize.",
	},
	{
		title: "Who can play?",
		content: "You must be 18 or older to participate. Have your scratch card or QR ready before you start.",
	},
	{
		title: "Why do you need my phone number?",
		content: "We use it to verify your entry and to contact you if you win, consistent with how the promotion is run.",
	},
	{
		title: "The scanner isn’t working — what can I try?",
		content: "Allow camera access for this site, scan in good light, hold the code steady, or use “Upload an image” with a sharp photo of the QR code.",
	},
	{
		title: "Where can I read the rules?",
		content: "See our How to play page and About section for full details, eligibility, and how winners are handled.",
	},
];

const Landing = () => {
	const [name, setname] = useState("");
	const [phone, setPhone] = useState("");
	const [openFaq, setOpenFaq] = useState(0);
	const entryRef = useRef(null);
	const heroRef = useRef(null);
	const heroWheelCooldownRef = useRef(false);
	const navigate = useNavigate();
	const { systemSettings } = useAppcontext();

	useEffect(() => {
		const onWheel = (e) => {
			if (e.deltaY <= 0) return;
			if (heroWheelCooldownRef.current) return;

			const hero = heroRef.current;
			const entry = entryRef.current;
			if (!hero || !entry) return;

			const hr = hero.getBoundingClientRect();
			const vh = window.innerHeight;
			const heroStillDominant = hr.bottom > vh * 0.42 && hr.top < vh * 0.55;

			if (!heroStillDominant) return;

			e.preventDefault();
			heroWheelCooldownRef.current = true;
			entry.scrollIntoView({ behavior: "smooth", block: "start" });
			window.setTimeout(() => {
				heroWheelCooldownRef.current = false;
			}, 700);
		};

		window.addEventListener("wheel", onWheel, { passive: false });
		return () => window.removeEventListener("wheel", onWheel);
	}, []);

	const handleDetailsSubmit = (e) => {
		e.preventDefault();
		if (name && phone) {
			if (!/^\d{10}$/.test(phone)) {
				toast.error("Phone number must be exactly 10 digits.");
				return;
			}
			// Navigate to the scan page with the collected details
			navigate("/play", { state: { name, phone } });
		} else {
			toast.error("Please fill in both your name and phone number.");
		}
	};

	const scrollToEntry = () => {
		entryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	return (
		<div className="w-full bg-zinc-50 text-gray-800 pt-28 pb-12 px-4 md:pt-36 md:px-6 lg:pt-40 lg:px-8">
			<section
				ref={heroRef}
				className="relative flex min-h-[calc(100dvh-6rem)] w-full flex-col overflow-hidden rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(234,88,12,0.3)] md:min-h-[calc(100dvh-10rem)] md:rounded-[3rem] lg:min-h-[calc(100dvh-14rem)] lg:rounded-[4rem]"
				aria-label="Baaloo hero"
			>
				<div className="pointer-events-none absolute inset-0 isolate">
					<div className="bg-pattern-red" aria-hidden />
					<div className="bg-pattern-orange" aria-hidden />
					<div className="bg-pattern-green" aria-hidden />
					<div className="bg-pattern-blue" aria-hidden />
					<div
						className="absolute inset-0 bg-gradient-to-t from-amber-950/80 via-amber-800/20 to-amber-200/20"
						aria-hidden
					/>
				</div>

				<div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-48 text-center md:px-8 md:pb-52 pt-14 md:pt-10">
					<div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-white shadow-xl backdrop-blur-md">
						<Sparkles className="h-4 w-4 text-amber-300" />
						<span className="text-xs font-bold tracking-widest uppercase md:text-sm">
							Instant Win Game
						</span>
						<Sparkles className="h-4 w-4 text-amber-300" />
					</div>

					<h1 className="mt-8 max-w-5xl font-black leading-[0.9] tracking-tight">
						<span className="block text-[clamp(3.5rem,12vw,8rem)] text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
							SCRATCH
						</span>
						<span className="block bg-gradient-to-br from-amber-200 via-yellow-400 to-orange-500 bg-clip-text text-transparent text-[clamp(3rem,11vw,7.5rem)] drop-shadow-sm">
							&amp; WIN
						</span>
					</h1>
					<p className="mt-6 max-w-xl text-lg font-medium text-white/90 drop-shadow-md md:text-2xl">
						Your lucky moment starts here. <span className="font-bold text-amber-300">Baaloo</span> makes winning quick and easy.
					</p>
					<button
						type="button"
						onClick={scrollToEntry}
						className="group mt-12 flex items-center gap-2 rounded-full bg-white px-10 py-4 text-lg font-bold text-orange-600 shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all hover:scale-105 hover:bg-orange-50 hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] active:scale-95 md:text-xl"
					>
						Let&apos;s Play Now
						<ChevronDown className="h-6 w-6 animate-bounce text-orange-500" />
					</button>
				</div>

				<div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 md:px-8 md:pb-10">
					<div className="mx-auto max-w-3xl rounded-[2rem] border border-white/50 bg-white/60 p-6 text-center shadow-2xl backdrop-blur-xl md:p-8">
						<p className="text-sm font-black uppercase tracking-widest text-orange-600/80 md:text-base">
							Play in seconds
						</p>
						<p className="mt-2 text-2xl font-black tracking-tight text-zinc-900 md:text-4xl">
							Scan. Win. <span className="text-orange-600">Smile.</span>
						</p>
						<p className="mt-4 text-base font-medium text-zinc-700 md:text-lg">
							Enter your details below, then scan the QR on your card. Winners may be directed to claim right away!
						</p>
					</div>
				</div>
			</section>

			<section
				ref={entryRef}
				id="scratch-entry"
				className="scroll-mt-[max(1.25rem,var(--app-nav-height,4.5rem))] px-4 py-20 md:py-24 relative"
			>
				<div className="absolute top-1/2 left-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/40 blur-[80px]" aria-hidden />

				<div className="mx-auto max-w-xl rounded-[2rem] border border-amber-200/40 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl md:p-12 relative z-10">
					<p className="text-center text-sm font-bold uppercase tracking-widest text-orange-600">
						Baaloo scratch &amp; win
					</p>
					<h2 className="mt-3 text-center text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-black text-zinc-900">
						{systemSettings.allowNewRedemptions ? "Enter details to begin" : "Validation Paused"}
					</h2>
					<p className="mt-3 text-center text-base text-zinc-600">
						{systemSettings.allowNewRedemptions 
							? "Next, you'll scan your QR code or upload a photo of it." 
							: "New ticket validations are temporarily paused for routine system maintenance. Please check back soon!"}
					</p>
					
					{systemSettings.allowNewRedemptions ? (
						<form
							onSubmit={handleDetailsSubmit}
							className="mt-10 w-full space-y-5 text-left"
						>
							<div>
								<label
									htmlFor="name"
									className="mb-1.5 block text-sm font-bold text-zinc-700"
								>
									Name
								</label>
								<input
									type="text"
									id="name"
									value={name}
									onChange={(e) => setname(e.target.value)}
									required
									placeholder="Enter your full name"
									className="block w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-4 text-zinc-900 shadow-inner outline-none ring-1 ring-zinc-200 transition-all focus:bg-white focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							<div>
								<label
									htmlFor="phone"
									className="mb-1.5 block text-sm font-bold text-zinc-700"
								>
									Phone Number
								</label>
								<input
									type="tel"
									id="phone"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									required
									pattern="\d{10}"
									placeholder="e.g. 0240000000"
									className="block w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-4 text-zinc-900 shadow-inner outline-none ring-1 ring-zinc-200 transition-all focus:bg-white focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							<button
								type="submit"
								className="mt-4 w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
							>
								Continue to scan
							</button>
						</form>
					) : (
						<div className="mt-10 flex flex-col items-center gap-6 text-center">
							<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
								<AlertTriangle size={40} />
							</div>
							<div className="space-y-1">
								<p className="font-black text-zinc-900">Services Paused</p>
								<p className="text-sm font-medium text-zinc-500 leading-relaxed">
									We are optimizing our validation engine. Your Baaloo tickets are safe—kindly hold onto them and try scanning again in a few hours.
								</p>
							</div>
							<div className="w-full h-px bg-zinc-100" />
							<p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
								Secure System Maintenance
							</p>
						</div>
					)}
				</div>
			</section>

			<section className="bg-zinc-50 px-4 py-20 md:py-28 relative overflow-hidden">
				<div className="absolute -top-40 -right-40 -z-10 h-96 w-96 rounded-full bg-yellow-200/50 blur-[100px]" aria-hidden />
				
				<div className="mx-auto max-w-6xl">
					<div className="text-center">
						<p className="text-sm font-bold uppercase tracking-widest text-orange-600 mb-3">How it works</p>
						<h2 className="text-[clamp(2rem,5vw,3rem)] leading-tight font-black text-zinc-900">
							Win in 4 easy steps
						</h2>
					</div>
					<div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{PLAYER_STEPS.map((s, idx) => {
							const Icon = s.icon;
							return (
								<div
									key={s.title}
									className="group relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-md shadow-zinc-200/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/10"
								>
									<div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-50 transition-transform duration-500 group-hover:scale-150" aria-hidden />
									
									<div className="relative z-10 flex items-center justify-between">
										<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm transition-colors group-hover:bg-orange-500 group-hover:text-white">
											<Icon className="h-6 w-6" strokeWidth={2.5} />
										</div>
										<span className="text-5xl font-black text-zinc-100 transition-colors group-hover:text-orange-500/10">
											0{idx + 1}
										</span>
									</div>
									<div className="relative z-10 mt-8">
										<h3 className="text-xl font-bold text-zinc-900">
											{s.title}
										</h3>
										<p className="mt-3 text-base font-medium text-zinc-500 leading-relaxed">
											{s.description}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			<section className="px-4 py-20 md:py-28 bg-white relative">
				<div className="mx-auto max-w-3xl">
					<div className="text-center mb-16">
						<h2 className="text-[clamp(2rem,5vw,3rem)] leading-tight font-black text-zinc-900">
							Frequently asked questions
						</h2>
						<p className="mt-4 text-lg font-medium text-zinc-500">
							New to Baaloo? Here&apos;s what you need to know.
						</p>
					</div>
					<div className="space-y-4">
						{FAQ_ITEMS.map((item, i) => {
							const open = openFaq === i;
							return (
								<div
									key={item.title}
									className={`overflow-hidden rounded-[1.5rem] border ${open ? 'border-orange-200 bg-orange-50/30' : 'border-zinc-200/80 bg-white'} transition-all duration-300`}
								>
									<button
										type="button"
										onClick={() =>
											setOpenFaq(open ? -1 : i)
										}
										className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-lg font-bold text-zinc-900 outline-none md:px-8"
									>
										<span>{item.title}</span>
										<div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${open ? 'bg-orange-200 text-orange-700' : 'bg-zinc-100 text-zinc-500'}`}>
											<ChevronDown
												className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
											/>
										</div>
									</button>
									<div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
										<div className="overflow-hidden">
											<div className="px-6 pb-6 pt-2 text-base font-medium leading-relaxed text-zinc-600 md:px-8">
												{item.content}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
					<div className="mt-12 text-center">
						<a
							href="/how-to-play"
							className="inline-block rounded-full bg-zinc-900 px-8 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800 active:scale-95"
						>
							How to play
						</a>
						<a
							href="/about"
							className="ml-4 inline-block rounded-full border-2 border-zinc-200/80 bg-white px-8 py-3.5 text-base font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-95"
						>
							About
						</a>
					</div>
				</div>
			</section>

			<section className="relative overflow-hidden bg-zinc-950 px-4 py-24 text-center md:py-32">
				<div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/20 blur-[120px]" aria-hidden />
				
				<div className="relative z-10 mx-auto max-w-2xl">
					<h2 className="text-[clamp(2.5rem,6vw,4rem)] leading-tight font-black text-white">
						Ready when you are.
					</h2>
					<p className="mx-auto mt-6 max-w-lg text-lg font-medium text-zinc-400 md:text-xl">
						Have your card handy? Jump straight in — it only takes a moment to discover your prize.
					</p>
					<button
						type="button"
						onClick={scrollToEntry}
						className="mt-10 rounded-full bg-white px-12 py-4 text-xl font-bold text-orange-600 shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all hover:scale-105 hover:bg-orange-50 hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] active:scale-95"
					>
						Start Now
					</button>
				</div>
			</section>

			<footer className="border-t border-zinc-200 bg-white px-4 py-12 text-center text-sm font-medium text-zinc-500">
				<p className="coiny text-3xl font-bold text-zinc-900">Baaloo</p>
				<p className="mt-4">Instant scratch &amp; win. Play responsibly.</p>
				<p className="mt-2 text-xs text-zinc-400">18+ only. Terms and conditions apply.</p>
			</footer>
		</div>
	);
};

export default Landing;
