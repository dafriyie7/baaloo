// Import necessary libraries and components
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/api";

const Scanner = () => {
	const [name, setname] = useState("");
	const [phone, setPhone] = useState("");
	const [loading, setLoading] = useState(false);
	const [step, setStep] = useState("details");
	const [scanning, setScanning] = useState(false);
	const [message, setMessage] = useState("");
	const [scannerInstance, setScannerInstance] = useState(null);
	const [isWinner, setIsWinner] = useState(false);

	// Effect for initializing and cleaning up the scanner instance
	useEffect(() => {
		if (step === "scan" && !scannerInstance) {
			const scanner = new Html5Qrcode("reader");
			setScannerInstance(scanner);

			// Cleanup function to stop the scanner when the component unmounts or step changes
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

	// start the QR code scanning process
	const startScan = async () => {
		try {
			setScanning(true);
			// Start the scanner using the device's rear camera
			await scannerInstance.start(
				{ facingMode: "environment" }, // Use the rear camera
				{
					fps: 10, // Scan at 10 frames per second
					// Configure the size of the scanning box to be responsive
					qrbox: (viewfinderWidth, viewfinderHeight) => {
						const minEdge = Math.min(
							viewfinderWidth,
							viewfinderHeight
						);
						const size = Math.floor(minEdge * 0.8); // 80% of the smaller dimension
						return { width: size, height: size };
					},
				},
				// Success callback when a QR code is decoded.
				async (decodedText) => {
					// Immediately stop scanning to prevent multiple triggers
					await stopScan();
					// Validate the code and submit the user's details
					await validateAndSubmit(decodedText);
				},
				() => {} // Optional error callback, left empty here
			);
		} catch (err) {
			console.error("Failed to start scanner", err);
			setScanning(false);
		}
	};

	// Function to stop the QR code scanning process
	const stopScan = async () => {
		if (scannerInstance && scannerInstance.isScanning) {
			await scannerInstance.stop();
			setScanning(false);
		}
	};
	// handle scanning a QR code from an uploaded image file
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

	// validate the code and submit user details
	const validateAndSubmit = async (scratchCode) => {
		setLoading(true);
		setMessage("");

		try {
			// The backend's `/players/add` endpoint now handles both validation
			// and saving the user in a single, atomic operation.
			const { data } = await axiosInstance.post("/players/add", {
				name,
				phone,
				code: scratchCode,
			});

			if (data.success) {
				// The backend now tells us if it was a winning code.
				const wasWinner = data.data.code.prize === 1;
				setIsWinner(wasWinner);
				toast.success("Your entry has been recorded!");

				// Set the appropriate message.
				setMessage(
					wasWinner
						? "Congratulations! You've won!"
						: "Sorry, not a winner this time."
				);
			}
		} catch (error) {
			const errorMessage =
				error.response?.data?.message ||
				"An error occurred. Please try again.";
			toast.error(errorMessage);
			setMessage(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	// handle the initial details form submission
	const handleDetailsSubmit = (e) => {
		e.preventDefault();
		if (name && phone) {
			if (!/^\d{10}$/.test(phone)) {
				toast.error("Phone number must be exactly 10 digits.");
				return;
			}
			setStep("scan");
		} else {
			toast.error("Please fill in both your name and phone number.");
		}
	};

	// reset the entire flow
	const resetFlow = () => {
		setname("");
		setPhone("");
		setStep("details");
		setMessage("");
		setIsWinner(false);
		setScannerInstance(null); // Dispose of the old scanner instance
	};

	// Render based on the current step
	const renderStep = () => {
		if (step === "details") {
			return (
				<>
					<h1 className="text-6xl md:text-8xl font-bold text-slate-800 mb-8 text-center animate-pulse text-shadow-lg">
						Ready to Win?
					</h1>
					<div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg text-center">
						<p className="text-gray-500 mb-4">
							Enter your details to begin.
						</p>
						<form
							onSubmit={handleDetailsSubmit}
							className="w-full space-y-2 text-left"
						>
							<div className="flex items-center justify-center gap-5">
								<label
									htmlFor="name"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Name
								</label>
								<input
									type="text"
									id="name"
									value={name}
									onChange={(e) => setname(e.target.value)}
									required
									placeholder="e.g. John Doe"
									className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								/>
							</div>
							<div className="flex items-center justify-center gap-5">
								<label
									htmlFor="phone"
									className="block text-sm font-medium text-gray-700 mb-1"
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
									className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								/>
							</div>
							<div className="pt-4 flex justify-end">
								<button
									type="submit"
									className="py-3 px-20 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105"
								>
									Let's Play!
								</button>
							</div>
						</form>
					</div>
				</>
			);
		}

		if (step === "scan") {
			// If a message exists, it means the scan is done and we should show the result.
			if (message) {
				return (
					<div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg text-center flex flex-col items-center">
						{isWinner ? (
							<>
								{/* Trophy Icon */}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-20 w-20 text-yellow-400 mb-4"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M12.89,3L14.85,3.4L11.11,21L9.15,20.6L12.89,3M19,2H5A3,3 0 0,0 2,5V6A1,1 0 0,0 3,7H4.53L8.27,24H15.73L19.47,7H21A1,1 0 0,0 22,6V5A3,3 0 0,0 19,2Z" />
								</svg>
								<h1 className="text-green-600 font-bold text-3xl mb-2">
									Congratulations!
								</h1>
							</>
						) : (
							<>
								{/* Refresh Icon */}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-20 w-20 text-slate-400 mb-4"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
								</svg>
								<h1 className="text-slate-700 font-bold text-3xl mb-2">
									So Close!
								</h1>
							</>
						)}
						<p className="mb-8 text-gray-600">{message}</p>
						<button
							onClick={resetFlow}
							className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105"
						>
							Play Again
						</button>
					</div>
				);
			}

			// Otherwise, show the scanner UI.
			return (
				<div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg text-center">
					<h1 className="text-3xl font-bold text-slate-800">
						Scan to Win!
					</h1>
					<p className="text-gray-500 mb-6">Welcome, {name}!</p>
					<div
						id="reader"
						className="w-full border-2 border-slate-200 rounded-xl shadow-inner overflow-hidden"
					></div>

					<div className="mt-6 w-full flex flex-col items-center gap-3">
						{loading ? (
							<p className="animate-pulse text-slate-600 font-medium py-3">
								Checking your code...
							</p>
						) : scanning ? (
							<button
								onClick={stopScan}
								className="w-full px-4 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
							>
								Stop
							</button>
						) : (
							<button
								onClick={startScan}
								className="w-full font-semibold px-4 py-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors"
							>
								Start Scanning
							</button>
						)}

						<label className="w-full text-center cursor-pointer font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 py-3 px-4 rounded-full transition-colors">
							Upload an Image
							<input
								type="file"
								accept="image/*"
								onChange={handleImageUpload}
								className="hidden" // Keep input hidden, label triggers it
							/>
						</label>
						<button
							onClick={() => setStep("details")}
							className="text-xs text-gray-500 hover:underline mt-2"
						>
							Go Back
						</button>
					</div>
				</div>
			);
		}
	};

	return (
		<div
			className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 px-4 py-8"
			// style={{ backgroundImage: `url(${fallingGoldBg})` }}
		>
			{renderStep()}
		</div>
	);
};

export default Scanner;
