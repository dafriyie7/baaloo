// Import necessary libraries and components
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/api";
import {
	QrCode,
	UserPlus,
	Sparkles,
	Trophy,
	ChevronDown,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppcontext } from "../context/AppContext";

const PLAYER_STEPS = [
	{
		title: "Enter your details",
		description:
			"Add your name and a valid phone number so we can record your entry.",
		icon: UserPlus,
	},
	{
		title: "Scan your code",
		description:
			"Use your camera to scan the QR on your Baaloo scratch card, or upload a clear photo.",
		icon: QrCode,
	},
	{
		title: "See if you won",
		description:
			"We validate your code instantly and let you know if you’re a winner.",
		icon: Sparkles,
	},
	{
		title: "Claim your prize",
		description:
			"If you win, follow the prompts to claim — non-winners can try again next time.",
		icon: Trophy,
	},
];

const FAQ_ITEMS = [
	{
		title: "What is Baaloo?",
		content:
			"Baaloo is an instant scratch-and-win experience. Enter your details, scan the code on your card, and find out right away if you’ve won a prize.",
	},
	{
		title: "Who can play?",
		content:
			"You must be 18 or older to participate. Have your scratch card or QR ready before you start.",
	},
	{
		title: "Why do you need my phone number?",
		content:
			"We use it to verify your entry and to contact you if you win, consistent with how the promotion is run.",
	},
	{
		title: "The scanner isn’t working — what can I try?",
		content:
			"Allow camera access for this site, scan in good light, hold the code steady, or use “Upload an image” with a sharp photo of the QR code.",
	},
	{
		title: "Where can I read the rules?",
		content:
			"See our How to play page and About section for full details, eligibility, and how winners are handled.",
	},
];

const Scanner = () => {
	const [name, setname] = useState("");
	const [phone, setPhone] = useState("");
	const [step, setStep] = useState("details");
	const [scanning, setScanning] = useState(false);
	const [message, setMessage] = useState("");
	const [scannerInstance, setScannerInstance] = useState(null);
	const [isWinner, setIsWinner] = useState(false);
	const [openFaq, setOpenFaq] = useState(0);
	const entryRef = useRef(null);
	const heroRef = useRef(null);
	const heroWheelCooldownRef = useRef(false);

	const { setWinner, isLoading, setIsLoading } = useAppcontext();
	const { code } = useParams();

	const navigate = useNavigate();

	useEffect(() => {
		if (step === "scan" && !scannerInstance) {
			const scanner = new Html5Qrcode("reader");
			setScannerInstance(scanner);

			return () => {
				if (scanner && scanner.isScanning) {
					scanner
						.stop()
						.catch((err) =>
							console.error(
								"Failed to stop scanner on cleanup",
								err
							)
						);
				}
			};
		}
	}, [step, scannerInstance]);

	/** One wheel tick (scroll down) while the hero fills the view jumps to #scratch-entry */
	useEffect(() => {
		if (step !== "details") return;

		const onWheel = (e) => {
			if (e.deltaY <= 0) return;
			if (heroWheelCooldownRef.current) return;

			const hero = heroRef.current;
			const entry = entryRef.current;
			if (!hero || !entry) return;

			const hr = hero.getBoundingClientRect();
			const vh = window.innerHeight;
			const heroStillDominant =
				hr.bottom > vh * 0.42 && hr.top < vh * 0.55;

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
	}, [step]);

	const startScan = async () => {
		try {
			setScanning(true);
			await scannerInstance.start(
				{ facingMode: "environment" },
				{
					fps: 10,
					qrbox: (viewfinderWidth, viewfinderHeight) => {
						const minEdge = Math.min(
							viewfinderWidth,
							viewfinderHeight
						);
						const size = Math.floor(minEdge * 0.8);
						return { width: size, height: size };
					},
				},
				async (decodedText) => {
					stopScan();
					await validateAndSubmit(decodedText);
				},
				() => {}
			);
		} catch (err) {
			console.error("Failed to start scanner", err);
			setScanning(false);
		}
	};

	const stopScan = async () => {
		if (scannerInstance && scannerInstance.isScanning) {
			await scannerInstance.stop();
			setScanning(false);
		}
	};

	const handleImageUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		try {
			const decodedText = await scannerInstance.scanFile(file, false);
			await validateAndSubmit(decodedText);
		} catch (err) {
			console.error("Error scanning image file.", err);
			toast.error("Could not detect QR code in this image.");
		}
	};

	const getCodeFromUrl = (url) => {
		const parts = url.split("/");
		return parts[parts.length - 1];
	};

	const validateAndSubmit = async (scratchCode) => {
		setMessage("");
		setIsLoading(true);

		try {
			const { data } = await axiosInstance.post("/players/add", {
				name,
				phone,
				code: getCodeFromUrl(scratchCode),
			});

			if (data.success) {
				const isWinner = data.data.code.isWinner;
				setIsWinner(isWinner);
				toast.success("Your entry has been recorded!");

				sessionStorage.setItem("winner", JSON.stringify(data.data));
				setWinner(data.data);

				if (isWinner) {
					navigate("/claim");
				} else {
					setMessage("Sorry, not a winner this time.");
					setStep("end");
				}
			}
		} catch (error) {
			const errorMessage =
				error.response?.data?.message ||
				"An error occurred. Please try again.";
			toast.error(errorMessage);
			setMessage(errorMessage);
			setStep("end");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDetailsSubmit = (e) => {
		e.preventDefault();
		if (name && phone) {
			if (!/^\d{10}$/.test(phone)) {
				toast.error("Phone number must be exactly 10 digits.");
				return;
			}
			code ? validateAndSubmit(code) : setStep("scan");
		} else {
			toast.error("Please fill in both your name and phone number.");
		}
	};

	const resetFlow = () => {
		setname("");
		setPhone("");
		setStep("details");
		setMessage("");
		setIsWinner(false);
		setIsLoading(false);
		setScannerInstance(null);
	};

	const scrollToEntry = () => {
		entryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const renderDetailsLanding = () => (
		<div className="w-full bg-gradient-to-b from-amber-50 via-amber-50/90 to-yellow-50/50 text-gray-800">
			<section
				ref={heroRef}
				className="relative flex min-h-[calc(100dvh-var(--app-nav-height,4.5rem))] w-full flex-col overflow-hidden"
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

				<div className="relative z-10 flex min-h-[calc(100dvh-var(--app-nav-height,4.5rem))] flex-1 flex-col items-center justify-center px-4 pb-40 pt-6 text-center md:px-8 md:pb-44 md:pt-8">
					<div className="flex animate-bounce items-center gap-2 rounded-full border border-amber-300/60 bg-amber-950/55 px-4 py-2 text-amber-50 backdrop-blur-sm shadow-[0_0_20px_rgba(251,146,60,0.3)]">
						<Sparkles className="h-4 w-4 text-amber-200" />
						<span className="text-xs font-semibold tracking-wide md:text-sm">
							INSTANT WIN GAME
						</span>
						<Sparkles className="h-4 w-4 text-amber-200" />
					</div>

					<h1 className="mt-6 max-w-4xl font-bold leading-[0.95] drop-shadow-lg [text-shadow:2px_2px_0_rgba(120,53,15,0.85)]">
						<span className="block text-[clamp(2.75rem,10vw,5.5rem)] text-white">
							SCRATCH
						</span>
						<span className="block bg-gradient-to-b from-amber-100 via-amber-200 to-orange-200 bg-clip-text text-transparent text-[clamp(2.75rem,10vw,5.5rem)] [text-shadow:none] drop-shadow-sm">
							&amp; WIN
						</span>
					</h1>
					<p className="mt-4 max-w-lg text-lg text-white/95 md:text-xl">
						Your lucky moment starts here —{" "}
						<span className="curved-underline font-semibold text-amber-100">
							Baaloo
						</span>{" "}
						makes it quick and easy.
					</p>
					<button
						type="button"
						onClick={scrollToEntry}
						className="mt-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 px-10 py-3.5 text-base font-bold text-amber-950 shadow-lg shadow-orange-500/30 transition hover:from-amber-400 hover:to-orange-300 md:text-lg"
					>
						Let&apos;s play
					</button>
				</div>

				<div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 md:px-8 md:pb-8">
					<div className="mx-auto max-w-2xl rounded-2xl border border-amber-300/40 bg-white/95 px-6 py-5 text-center shadow-xl shadow-amber-200/30 backdrop-blur-sm md:px-10">
						<p className="text-sm font-semibold text-amber-900 md:text-base">
							Play in seconds
						</p>
						<p className="mt-2 bg-gradient-to-r from-amber-900 via-amber-700 to-orange-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-3xl">
							Scan. Win. Smile.
						</p>
						<p className="mt-3 text-sm text-gray-600">
							Enter your details below, then scan the QR on your
							card. Winners may be directed to claim right away.
						</p>
					</div>
				</div>
			</section>

			<section
				ref={entryRef}
				id="scratch-entry"
				className="scroll-mt-[max(1.25rem,var(--app-nav-height,4.5rem))] px-4 py-14 md:py-16"
			>
				<div className="mx-auto max-w-lg rounded-2xl border border-amber-100/80 bg-white p-6 shadow-lg md:p-10">
					<p className="text-center text-sm font-semibold uppercase tracking-wide text-amber-900">
						Baaloo scratch &amp; win
					</p>
					<h2 className="mt-2 text-center text-2xl font-bold text-gray-900 md:text-3xl">
						Enter your details to begin
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Next, you&apos;ll scan your QR code or upload a photo of
						it.
					</p>
					<form
						onSubmit={handleDetailsSubmit}
						className="mt-8 w-full space-y-4 text-left"
					>
						<div>
							<label
								htmlFor="name"
								className="mb-1 block text-sm font-medium text-gray-700"
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
								className="block w-full rounded-xl border border-amber-200/60 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/35"
							/>
						</div>
						<div>
							<label
								htmlFor="phone"
								className="mb-1 block text-sm font-medium text-gray-700"
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
								className="block w-full rounded-xl border border-amber-200/60 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/35"
							/>
						</div>
						<button
							type="submit"
							className="w-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 py-3.5 text-base font-bold text-amber-950 shadow-md shadow-amber-500/25 transition hover:from-amber-400 hover:to-yellow-400"
						>
							Continue to scan
						</button>
					</form>
				</div>
			</section>

			<section className="bg-white px-4 py-14 md:py-20">
				<div className="mx-auto max-w-6xl">
					<h2 className="text-center text-2xl font-bold text-stone-900 md:text-3xl">
						Win in 4 easy steps
					</h2>
					<div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
						{PLAYER_STEPS.map((s, idx) => {
							const Icon = s.icon;
							return (
								<div
									key={s.title}
									className="rounded-2xl border border-amber-100/70 bg-amber-50/30 p-5 shadow-sm"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2 text-amber-950">
											<Icon
												className="h-6 w-6 shrink-0"
												strokeWidth={2}
											/>
											<span className="font-semibold">
												{s.title}
											</span>
										</div>
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-yellow-500 text-sm font-bold text-amber-950 shadow-sm">
											0{idx + 1}
										</span>
									</div>
									<p className="mt-3 text-sm leading-relaxed text-gray-600">
										{s.description}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			<section className="px-4 py-14 md:py-20">
				<div className="mx-auto max-w-3xl">
					<h2 className="text-center text-2xl font-bold text-stone-900 md:text-3xl">
						Frequently asked questions
					</h2>
					<p className="mt-3 text-center text-gray-600">
						New to Baaloo? Here&apos;s what you need to know.
					</p>
					<div className="mt-8 space-y-2">
						{FAQ_ITEMS.map((item, i) => {
							const open = openFaq === i;
							return (
								<div
									key={item.title}
									className="overflow-hidden rounded-xl border border-gray-200 bg-white"
								>
									<button
										type="button"
										onClick={() =>
											setOpenFaq(open ? -1 : i)
										}
										className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-medium text-amber-950 md:px-5"
									>
										<span>
											{i + 1}. {item.title}
										</span>
										<ChevronDown
											className={`h-5 w-5 shrink-0 transition-transform ${
												open ? "rotate-180" : ""
											}`}
										/>
									</button>
									{open && (
										<div className="border-t border-gray-100 px-4 py-4 text-sm leading-relaxed text-gray-600 md:px-5">
											{item.content}
										</div>
									)}
								</div>
							);
						})}
					</div>
					<div className="mt-8 text-center">
						<a
							href="/how-to-play"
							className="inline-block rounded-full border-2 border-yellow-500 px-6 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-yellow-50"
						>
							How to play
						</a>
						<a
							href="/about"
							className="ml-3 inline-block rounded-full border-2 border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
						>
							About
						</a>
					</div>
				</div>
			</section>

			<section className="h-3 w-full bg-gradient-to-r from-amber-900 via-yellow-600 to-amber-800" />

			<section className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 px-4 py-16 text-center text-white">
				<h2 className="text-2xl font-bold md:text-3xl">
					Ready when you are
				</h2>
				<p className="mx-auto mt-3 max-w-md text-amber-100/90">
					Have your card handy? Jump straight in — it only takes a
					moment.
				</p>
				<button
					type="button"
					onClick={scrollToEntry}
					className="mt-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-12 py-4 text-lg font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-400 hover:to-yellow-300"
				>
					Start now
				</button>
			</section>

			<footer className="border-t border-amber-200/40 bg-stone-200/80 px-4 py-10 text-center text-sm text-gray-600">
				<p className="font-bold text-amber-950 coiny text-lg">Baaloo</p>
				<p className="mt-2">Instant scratch &amp; win. Play responsibly.</p>
				<p className="mt-1 text-xs text-gray-500">18+ only.</p>
			</footer>
		</div>
	);

	const renderStep = () => {
		if (step === "details") {
			return renderDetailsLanding();
		}

		if (step === "scan") {
			return (
				<div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-yellow-50/70 px-4 py-12">
					<div className="w-full max-w-md rounded-2xl border border-amber-200/60 bg-white p-8 shadow-xl shadow-amber-200/20">
						<div className="mb-6 flex justify-center">
							<div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 px-4 py-2 text-amber-950 font-semibold shadow-sm">
								<QrCode className="h-5 w-5" />
								<span className="text-sm font-semibold">
									Scan your code
								</span>
							</div>
						</div>
						<h1 className="text-center text-2xl font-bold text-gray-900">
							Scan to Win!
						</h1>
						<p className="mt-2 text-center text-gray-600">
							Welcome, {name}!
						</p>
						<div
							id="reader"
							className="mt-6 w-full overflow-hidden rounded-xl border-2 border-amber-100 shadow-inner"
						/>

						<div className="mt-6 flex w-full flex-col items-center gap-3">
							{isLoading ? (
								<p className="animate-pulse py-3 font-medium text-amber-900">
									Checking your code...
								</p>
							) : scanning ? (
								<button
									type="button"
									onClick={stopScan}
									className="w-full rounded-full bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
								>
									Stop
								</button>
							) : (
								<button
									type="button"
									onClick={startScan}
									className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-3 font-bold text-amber-950 shadow-md shadow-amber-400/25 transition hover:from-amber-400 hover:to-yellow-400"
								>
									Start Scanning
								</button>
							)}

							<label className="w-full cursor-pointer rounded-full border border-amber-300 py-3 text-center text-sm font-medium text-amber-900 transition hover:bg-yellow-50">
								Upload an Image
								<input
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className="hidden"
								/>
							</label>
							<button
								type="button"
								onClick={() => setStep("details")}
								className="mt-1 text-xs text-gray-500 hover:underline"
							>
								Go Back
							</button>
						</div>
					</div>
				</div>
			);
		}

		if (step === "end") {
			return (
				<div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-yellow-50/70 px-4 py-12">
					<div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-amber-200/60 bg-white p-8 text-center shadow-xl shadow-amber-200/20">
						{isWinner ? (
							<>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="mb-4 h-20 w-20 text-yellow-500"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M12.89,3L14.85,3.4L11.11,21L9.15,20.6L12.89,3M19,2H5A3,3 0 0,0 2,5V6A1,1 0 0,0 3,7H4.53L8.27,24H15.73L19.47,7H21A1,1 0 0,0 22,6V5A3,3 0 0,0 19,2Z" />
								</svg>
								<h1 className="mb-2 text-3xl font-bold text-amber-900">
									Congratulations!
								</h1>
							</>
						) : (
							<>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="mb-4 h-20 w-20 text-gray-400"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
								</svg>
								<h1 className="mb-2 text-3xl font-bold text-gray-800">
									So Close!
								</h1>
							</>
						)}
						<p className="mb-8 text-gray-600">{message}</p>
						<button
							type="button"
							onClick={resetFlow}
							className="w-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-bold text-amber-950 shadow-md shadow-amber-400/25 transition hover:from-amber-400 hover:to-yellow-400 sm:w-auto"
						>
							Play Again
						</button>
					</div>
				</div>
			);
		}
	};

	return <div className="w-full">{renderStep()}</div>;
};

export default Scanner;
