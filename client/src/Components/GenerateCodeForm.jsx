import { useState } from "react";
import toast from "react-hot-toast";
import axios from "../../lib/api";
import { useAppcontext } from "../context/AppContext";
import { ChevronDown, ChevronUp } from "lucide-react";

const GenerateCodeForm = ({ onGenerationSuccess, existingBatches }) => {
	const [batchNumber, setBatchNumber] = useState("");
	const [totalCodes, setTotalCodes] = useState("");
	const [costPerCode, setCostPerCode] = useState("");
	const [giveawayPercentage, setGiveawayPercentage] = useState("0");
	const [winningPrize, setWinningPrize] = useState("");
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const { currency, isLoading, setIsLoading } = useAppcontext();

	const generateCode = async (e) => {
		e.preventDefault();
		if (isLoading) return;
		setIsLoading(true);

		if (
			!batchNumber ||
			!totalCodes ||
			!costPerCode ||
			!giveawayPercentage ||
			!winningPrize
		) {
			toast.error("Please fill in all fields");
			setIsLoading(false);
			return;
		}

		if (!/^[A-Z]/.test(batchNumber)) {
			toast.error("Batch number must start with a capital letter.");
			setIsLoading(false);
			return;
		}

		if (existingBatches.some((b) => b.batchNumber === batchNumber)) {
			toast.error(`Batch number "${batchNumber}" is not available`);
			setIsLoading(false);
			return;
		}

		try {
			const { data } = await axios.post("/scratch-codes/generate", {
				batchNumber,
				totalCodes,
				costPerCode,
				giveawayPercentage,
				winningPrize,
			});

			if (data.success) {
				toast.success(
					"Codes generated successfully. Refreshing list..."
				);
				setBatchNumber("");
				setTotalCodes("");
				setCostPerCode("");
				setGiveawayPercentage("");
				setWinningPrize("");
				onGenerationSuccess();
				setIsMenuOpen(false);
			} else {
				toast.error(data.message);
				setIsLoading(false);
			}
		} catch (error) {
			console.error(
				"Error generating codes:",
				error.response?.data || error.message
			);
			toast.error(
				error.response?.data?.message ||
					"An error occurred while generating codes."
			);
		} finally {
			// setIsLoading is handled in success/error paths
		}
	};

	return (
		<div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg mb-8">
			<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
				Generate New Code
			</h2>
			<form
				onSubmit={generateCode}
				className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${
					isMenuOpen
						? "max-h-[500px] opacity-100"
						: "max-h-0 opacity-0"
				}`}
			>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="batchNumber"
							className="block text-sm font-medium text-gray-700"
						>
							Batch Number
						</label>
						<input
							id="batchNumber"
							value={batchNumber}
							onChange={(e) => setBatchNumber(e.target.value)}
							type="text"
							placeholder="eg.A1"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						/>
					</div>
					<div>
						<label
							htmlFor="totalCodes"
							className="block text-sm font-medium text-gray-700"
						>
							Total Codes
						</label>
						<input
							id="totalCodes"
							value={totalCodes}
							onChange={(e) => setTotalCodes(e.target.value)}
							type="text"
							placeholder="eg.10"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						/>
					</div>
					<div>
						<label
							htmlFor="costPerCode"
							className="block text-sm font-medium text-gray-700"
						>
							Cost Per Code ({currency})
						</label>
						<input
							id="costPerCode"
							value={costPerCode}
							onChange={(e) => setCostPerCode(e.target.value)}
							type="number"
							placeholder="e.g., 10"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						/>
					</div>
					<div>
						<label
							htmlFor="giveawayPercentage"
							className="block text-sm font-medium text-gray-700"
						>
							Percentage (%)
						</label>
						<select
							id="giveawayPercentage"
							value={giveawayPercentage}
							onChange={(e) =>
								setGiveawayPercentage(e.target.value)
							}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						>
							{[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
								(val) => (
									<option key={val} value={val}>
										{val}
									</option>
								)
							)}
						</select>
					</div>

					<div>
						<label
							htmlFor="winningPrize"
							className="block text-sm font-medium text-gray-700"
						>
							Prize ({currency})
						</label>
						<input
							id="winningPrize"
							value={winningPrize}
							onChange={(e) => setWinningPrize(e.target.value)}
							type="number"
							placeholder="e.g., 50"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						/>
					</div>
				</div>
				<button
					type="submit"
					disabled={isLoading}
					className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-5"
				>
					{isLoading ? "Generating..." : "Generate New QR Code"}
				</button>
			</form>
			<div className="w-full flex justify-center animate-bounce">
				<button
					onClick={() => setIsMenuOpen(isMenuOpen ? false : true)}
				>
					{isMenuOpen ? <ChevronUp /> : <ChevronDown />}
				</button>
			</div>
		</div>
	);
};

export default GenerateCodeForm;
