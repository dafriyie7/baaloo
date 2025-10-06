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
			// The backend's `/winners/add` endpoint now handles both validation
			// and saving the user in a single, atomic operation.
			const { data } = await axiosInstance.post("/winners/add", {
				name,
				phone,
				code: scratchCode,
			});

			if (data.success) {
				// The backend now tells us if it was a winning code.
				const wasWinner = data.data.prize === 1;
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
				<div className="p-6 flex flex-col items-center w-full max-w-lg mx-auto">
					<h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-slate-800">
						Enter Your Details to Scan
					</h1>
					<form
						onSubmit={handleDetailsSubmit}
						className="w-full bg-white rounded-xl shadow-lg p-8 space-y-6"
					>
						<div>
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
								className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
							/>
						</div>
						<div>
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
								className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
							/>
						</div>
						<div className="pt-4">
							<button
								type="submit"
								className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105"
							>
								Proceed to Scan
							</button>
						</div>
					</form>
				</div>
			);
		}

		if (step === "scan") {
			// If a message exists, it means the scan is done and we should show the result.
			if (message) {
				return (
					<div className="p-6 rounded-lg shadow-lg w-full max-w-md text-center bg-white">
						{isWinner ? (
							<p className="text-green-600 font-bold text-4xl mb-4">
								Congratulations!
							</p>
						) : (
							<p className="text-red-500 font-bold text-4xl mb-4">
								Better Luck Next Time!
							</p>
						)}
						<p className="mb-8 text-lg text-gray-600">{message}</p>
						<button
							onClick={resetFlow}
							className="px-6 py-2 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-transform duration-300 hover:scale-105"
						>
							Scan Another
						</button>
					</div>
				);
			}

			// Otherwise, show the scanner UI.
			return (
				<div className="flex flex-col items-center w-full max-w-md">
					<h1 className="text-3xl font-bold text-slate-800">
						Scan Your QR Code
					</h1>
					<p className="text-md text-gray-500 mb-6">
						Welcome, {name}!
					</p>
					<div
						id="reader"
						className="w-full border rounded-lg shadow-sm overflow-hidden"
					></div>

					<div className="mt-6 w-full flex flex-col items-center gap-4">
						{loading ? (
							<p>Processing...</p>
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

						<p className="text-sm text-gray-500">or</p>

						<label className="w-full text-center cursor-pointer font-medium text-sm text-slate-900 border bg-white hover:bg-gray-50 py-3 px-4 rounded-full shadow-sm">
							Upload an Image
							<input
								type="file"
								accept="image/*"
								onChange={handleImageUpload}
								className="hidden"
							/>
						</label>
						<button
							onClick={() => setStep("details")}
							className="text-sm text-gray-500 mt-2 cursor-pointer"
						>
							Go Back
						</button>
					</div>
				</div>
			);
		}
	};

	return (
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 px-4 py-8">
			{renderStep()}
		</div>
	);
};

export default Scanner;
