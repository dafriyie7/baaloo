import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/api";
import {
	QrCode,
	Sparkles,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppcontext } from "../context/AppContext";
import Won from "../Components/Won";
import Lost from "../Components/Lost";
import Cashback from "../Components/Cashback";

const Scanner = () => {
	const [name, setname] = useState("");
	const [phone, setPhone] = useState("");
	const [step, setStep] = useState("details");
	const [scanning, setScanning] = useState(false);
	const [message, setMessage] = useState("");
	const [scannerInstance, setScannerInstance] = useState(null);
	const [isWinner, setIsWinner] = useState(false);
	const [isCashback, setIsCashback] = useState(false);
	const [cashbackAmount, setCashbackAmount] = useState(null);

	const { setWinner, isLoading, setIsLoading } = useAppcontext();
	const { code } = useParams();
	const navigate = useNavigate();
	const location = useLocation();

	// If name and phone are passed from the landing page, skip the details step
	useEffect(() => {
		if (location.state?.name && location.state?.phone) {
			setname(location.state.name);
			setPhone(location.state.phone);
			if (code) {
				// We don't auto-validate here because we need to wait for state to settle, 
				// but handleDetailsSubmit will be triggered if details are present in some cases.
				// In this lean version, we just move to the next step or validate if code exists.
			}
		}
	}, [location.state, code]);

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
		if (!url) return "";
		const parts = String(url).split("/");
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
				const isCashbackFlag = data.data.code.isCashback || false;
				
				setIsWinner(isWinner);
				setIsCashback(isCashbackFlag);
				const cbAmt = Number(data.data?.code?.prizeAmount);
				setCashbackAmount(
					isCashbackFlag && Number.isFinite(cbAmt) ? cbAmt : null
				);
				
				toast.success("Your entry has been recorded!");

				sessionStorage.setItem("winner", JSON.stringify(data.data));
				setWinner(data.data);

				if (isWinner) {
					navigate("/claim");
				} else {
					if (isCashbackFlag) {
						setMessage("You got your cashback!");
					} else {
						setMessage("Sorry, not a winner this time.");
					}
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
		if (e) e.preventDefault();
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

	// Effectively auto-submit if we arrive with details and a code
	useEffect(() => {
		if (step === "details" && name && phone && code) {
			handleDetailsSubmit();
		}
	}, [step, name, phone, code]);

	const resetFlow = () => {
		setname("");
		setPhone("");
		setStep("details");
		setMessage("");
		setIsWinner(false);
		setIsCashback(false);
		setCashbackAmount(null);
		setIsLoading(false);
		setScannerInstance(null);
	};

	const renderDetailsForm = () => (
		<div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-zinc-50 px-4 py-20 relative overflow-hidden">
			{/* Background soft blob */}
			<div className="absolute top-1/2 left-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/40 blur-[80px]" aria-hidden />

			<div className="mx-auto w-full max-w-xl rounded-[2.5rem] border border-amber-200/40 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl md:p-12 relative z-10">
				<p className="text-center text-sm font-bold uppercase tracking-widest text-orange-600">
					Baaloo scratch & win
				</p>
				<h2 className="mt-3 text-center text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-black text-zinc-900">
					Confirm your details
				</h2>
				<p className="mt-2 text-center text-base text-zinc-600">
					Enter your information to proceed with validation.
				</p>
				
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
						{code ? "Validate code" : "Continue to scan"}
					</button>
				</form>
			</div>
		</div>
	);

	const renderStep = () => {
		if (step === "details") {
			return renderDetailsForm();
		}

		if (step === "scan") {
			return (
				<div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-zinc-50 px-4 py-12 relative overflow-hidden">
					<div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/20 blur-[100px]" aria-hidden />
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
			if (isCashback) {
				return (
					<Cashback
						message={message}
						onRetry={resetFlow}
						amount={
							cashbackAmount != null && Number.isFinite(cashbackAmount)
								? String(cashbackAmount)
								: "0"
						}
						onClaim={() => toast.success("Cashback claimed!")}
					/>
				);
			}
			if (isWinner) {
				const winnerData = sessionStorage.getItem("winner") ? JSON.parse(sessionStorage.getItem("winner")) : null;
				return <Won winner={winnerData} onHome={() => navigate("/")} />;
			}
			return <Lost message={message} onRetry={resetFlow} onHome={() => navigate("/")} />;
		}
	};

	return <div className="w-full">{renderStep()}</div>;
};

export default Scanner;
