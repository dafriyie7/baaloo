import axios from "../../lib/api";
import { useState } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import CodeCard from "../Components/CodeCard";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

const Codes = () => {
	const [codes, setCodes] = useState([]);
	const [batches, setBatches] = useState([]);
	const [selectedBatch, setSelectedBatch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [limit, setLimit] = useState(20);

	const [batchNumber, setBatchNumber] = useState("");
	const [count, setCount] = useState("");
	const [loading, setLoading] = useState(false);
	const [costPerCode, setCostPerCode] = useState("");
	const [percentage, setPercentage] = useState("");
	const [prize, setPrize] = useState("");

	// fetch all codes
	const fetchCodes = async () => {
		try {
			const { data } = await axios.get("/scratch-codes/get", {
				params: { selectedBatch, page: currentPage, limit },
			});

			if (data.success) {
				setCodes(data.data.withQRCodes);
				setTotalPages(data.data.totalPages);
				setCurrentPage(data.data.currentPage);
				setBatches(data.data.batches);
				if (!selectedBatch && data.data.batches.length > 0) {
					setSelectedBatch(data.data.batches[0]);
				}
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

		if (!batchNumber || !count || !costPerCode || !percentage || !prize) {
			toast.error("Please fill in all fields");
			setLoading(false);
			return;
		}

		if (!/^[A-Z]/.test(batchNumber)) {
			toast.error("Batch number must start with a capital letter.");
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
				costPerCode,
				percentage,
				prize,
			});

			if (data.success) {
				setCodes(data.data); // pre-shuffled by backend

				// Clear form fields
				setBatchNumber("");
				setCount("");
				setCostPerCode("");
				setPercentage("");
				setPrize("");

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
	}, [selectedBatch, currentPage, limit]);

	const handlePageChange = (newPage) => {
		if (newPage < 1 || newPage > totalPages) return;
		setCurrentPage(newPage);
	};

	const renderPagination = () => {
		const pageNumbers = [];
		const siblingCount = 1;
		const totalPageNumbersToShow = 7; // A reasonable number of page links to show

		if (totalPages <= totalPageNumbersToShow) {
			for (let i = 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
			const rightSiblingIndex = Math.min(
				currentPage + siblingCount,
				totalPages
			);

			const shouldShowLeftDots = leftSiblingIndex > 2;
			const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

			pageNumbers.push(1); // Always show first page

			if (shouldShowLeftDots) {
				pageNumbers.push("...");
			}

			for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
				if (i > 1 && i < totalPages) {
					pageNumbers.push(i);
				}
			}

			if (shouldShowRightDots) {
				pageNumbers.push("...");
			}

			pageNumbers.push(totalPages); // Always show last page
		}

		// Remove duplicates that might occur in edge cases
		return [...new Set(pageNumbers)];
	};

	return (
		// Use max-width and margin-auto for better responsiveness
		<div className="w-full min-h-screen bg-gray-100">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto flex flex-col items-center">
				<div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg mb-8">
					<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
						Generate New Code
					</h2>
					<form onSubmit={generateCode} className="space-y-4">
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
									htmlFor="costPerCode"
									className="block text-sm font-medium text-gray-700"
								>
									Cost Per Code
								</label>
								<input
									id="costPerCode"
									value={costPerCode}
									onChange={(e) =>
										setCostPerCode(e.target.value)
									}
									type="number"
									placeholder="e.g., 10"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								/>
							</div>
							<div>
								<label
									htmlFor="percentage"
									className="block text-sm font-medium text-gray-700"
								>
									Percentage (%)
								</label>
								<input
									id="percentage"
									value={percentage}
									onChange={(e) =>
										setPercentage(e.target.value)
									}
									type="number"
									placeholder="e.g., 20"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								/>
							</div>
							<div>
								<label
									htmlFor="prize"
									className="block text-sm font-medium text-gray-700"
								>
									Prize
								</label>
								<input
									id="prize"
									value={prize}
									onChange={(e) => setPrize(e.target.value)}
									type="number"
									placeholder="e.g., 50"
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

						<div className="w-full flex justify-center items-end gap-4 mb-5">
							<div>
								<label
									htmlFor="batch-select"
									className="block text-sm font-medium text-gray-700 text-center"
								>
									Select a Batch
								</label>
								<select
									id="batch-select"
									value={selectedBatch}
									onChange={(e) => {
										setSelectedBatch(e.target.value);
										setCurrentPage(1); // Reset to first page on batch change
									}}
									className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								>
									{batches.map((batch) => (
										<option key={batch} value={batch}>
											{batch}
										</option>
									))}
								</select>
							</div>
							<div>
								<label
									htmlFor="limit-select"
									className="block text-sm font-medium text-gray-700 text-center"
								>
									Per Page
								</label>
								<select
									id="limit-select"
									value={limit}
									onChange={(e) => {
										setLimit(Number(e.target.value));
										setCurrentPage(1); // Reset to first page on limit change
									}}
									className="px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								>
									<option value="10">10</option>
									<option value="20">20</option>
									<option value="50">50</option>
									<option value="100">100</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
							{codes.map((code) => (
								<CodeCard key={code._id} code={code} />
							))}
						</div>

						{/* Pagination Controls */}
						{totalPages > 1 && (
							<div className="mt-8 flex justify-center items-center gap-2">
								<button
									onClick={() =>
										handlePageChange(currentPage - 1)
									}
									disabled={currentPage === 1}
									className="px-4 py-2 bg-gray-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronsLeft />
								</button>
								{renderPagination().map((page, index) =>
									typeof page === "number" ? (
										<button
											key={index}
											onClick={() =>
												handlePageChange(page)
											}
											className={`w-10 h-10 rounded-full transition-colors ${
												currentPage === page
													? "bg-slate-900 text-white"
													: "bg-gray-200 hover:bg-gray-300"
											}`}
										>
											{page}
										</button>
									) : (
										<span key={index} className="px-2">
											...
										</span>
									)
								)}
								<button
									onClick={() =>
										handlePageChange(currentPage + 1)
									}
									disabled={currentPage === totalPages}
									className="px-4 py-2 bg-gray-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronsRight />
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Codes;
