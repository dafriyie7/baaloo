import axios from "../../lib/api";
import { useState } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import CodeCard from "../Components/CodeCard";

const Dashboard = () => {
	const [codes, setCodes] = useState([]);
	const [batches, setBatches] = useState([]);
	const [selectedBatch, setSelectedBatch] = useState("");

	const [batchNumber, setBatchNumber] = useState("");
	const [count, setCount] = useState("");
	const [winRate, setWinRate] = useState("0.2");
	const [loading, setLoading] = useState(false);

	// fetch all codes
	const fetchCodes = async () => {
		try {
			const { data } = await axios.get(`/scratch-codes/get`, {
				params: { selectedBatch },
			});

			if (data.success) {
				setCodes(data.data.withQRCodes);
				setBatches(data.data.batches);
				setSelectedBatch(selectedBatch || data.data.batches[0]);
				toast.success("Codes fetched successfully");
			} else {
				console.log(data.message);
				toast.error(data.message);
			}
		} catch (error) {
			console.error(
				"Error fetching filter options:",
				error.response?.data || error.message
			);
			toast.error(
				error.response?.data?.message ||
					"An error occurred while fetching filter options."
			);
		}
	};

	// generate qr code
	const generateCode = async (e) => {
		e.preventDefault();
		if (loading) return;
		setLoading(true);

		if (batchNumber === "" || count === "") {
			toast.error("Please fill in all fields");
			setLoading(false);
			return;
		}

		if (!/^[A-Z]/.test(batchNumber)) {
			toast.error("Batch number must start with a capital letter.");
			setLoading(false);
			return;
		}

		if (isNaN(parseFloat(winRate)) || parseFloat(winRate) < 0) {
			toast.error("Invalid win rate");
			setLoading(false);
			return;
		}

		// check if batch number already exists
		if (batches.includes(batchNumber)) {
			toast.error(`Batch number "${batchNumber}" is not available`);
			setLoading(false);
			return;
		}

		try {
			const { data } = await axios.post("/scratch-codes/generate", {
				batchNumber,
				count,
				winRate: parseFloat(winRate),
			});

			if (data.success) {
				setCodes(data.data); // pre-shuffled by backend

				// Clear form fields
				setBatchNumber("");
				setCount("");
				setWinRate("0.2");

				toast.success("Code generated successfully");
			} else {
				toast.error(data.message);
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
			setLoading(false);
		}
	};

	// Fetch codes on mount and when selectedBatch changes
	useEffect(() => {
		fetchCodes();
	}, [selectedBatch]);

	return (
		// Use max-width and margin-auto for better responsiveness
		<div className="w-full min-h-screen bg-gray-100">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto flex flex-col items-center">
				<div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg mb-8">
					<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
						Generate New Code
					</h2>
					<form onSubmit={generateCode} className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="">
								<label
									htmlFor="batchNumber"
									className="block text-sm font-medium text-gray-700"
								>
									Batch Number
								</label>
								<input
									id="batchNumber"
									value={batchNumber}
									onChange={(e) =>
										setBatchNumber(e.target.value)
									}
									type="text"
									placeholder="eg.A1"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								/>
							</div>
							<div>
								<label
									htmlFor="count"
									className="block text-sm font-medium text-gray-700"
								>
									Count
								</label>
								<input
									id="count"
									value={count}
									onChange={(e) => setCount(e.target.value)}
									type="text"
									placeholder="eg.10"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								/>
							</div>
							<div>
								<label
									htmlFor="winRate"
									className="block text-sm font-medium text-gray-700"
								>
									Win Rate (%)
								</label>
								<input
									id="winRate"
									value={winRate * 100}
									onChange={(e) =>
										setWinRate(
											isNaN(parseFloat(e.target.value))
												? 0
												: parseFloat(e.target.value) /
														100
										)
									}
									type="number"
									placeholder="eg. 20"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								/>
							</div>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Generating..." : "Generate New QR Code"}
						</button>
					</form>
				</div>

				{codes && codes.length > 0 && (
					<div className="w-full bg-white p-8 rounded-2xl shadow-lg">
						<h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
							Scratch Codes
						</h1>

						<div className="w-full flex flex-col items-center gap-2 mb-5">
							<label
								htmlFor="batch-select"
								className="text-sm font-medium text-gray-700"
							>
								Select a Batch
							</label>
							<select
								id="batch-select"
								value={selectedBatch}
								onChange={(e) =>
									setSelectedBatch(e.target.value)
								}
								className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
							>
								{batches.map((batch) => (
									<option key={batch} value={batch}>
										{batch}
									</option>
								))}
							</select>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
							{codes.map((code) => (
								<CodeCard key={code._id} code={code} />
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Dashboard;
