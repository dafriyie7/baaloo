import axios from "../../lib/api";
import { useState } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import CodeCard from "../Components/CodeCard";
import {
	ChevronsLeft,
	ChevronsRight,
	Hash,
	DollarSign,
	TrendingUp,
	Gift,
	Percent,
} from "lucide-react";
import StatCard from "../Components/StatCard";
import GenerateCodeForm from "../Components/GenerateCodeForm";
import { useAppcontext } from "../context/AppContext";

const Codes = () => {
	const [codes, setCodes] = useState([]);
	const [batches, setBatches] = useState([]);
	const [selectedBatchId, setSelectedBatchId] = useState("");
	const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [limit, setLimit] = useState(20);

	const { setIsLoading, currency } = useAppcontext();

	// fetch all codes
	const fetchCodes = async () => {
		setIsLoading(true);
		try {
			const { data } = await axios.get("/scratch-codes/get", {
				params: {
					selectedBatch: selectedBatchId,
					page: currentPage,
					limit,
				},
			});

			if (data.success) {
				setCodes(data.data.withQRCodes);
				setTotalPages(data.data.totalPages);
				setCurrentPage(data.data.currentPage);
				const fetchedBatches = data.data.batches;
				setBatches(fetchedBatches);

				if (fetchedBatches.length > 0) {
					if (!selectedBatchId) {
						setSelectedBatchId(fetchedBatches[0]._id);
						setSelectedBatchDetails(fetchedBatches[0]);
					} else {
						setSelectedBatchDetails(
							fetchedBatches.find(
								(b) => b._id === selectedBatchId
							)
						);
					}
				}
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
		} finally {
			setIsLoading(false);
		}
	};

	const handleGenerationSuccess = async () => {
		setSelectedBatchId(""); // Reset to fetch the latest batch
		setCurrentPage(1);
		await fetchCodes();
	};

	// Fetch codes on mount and when selectedBatch changes
	useEffect(() => {
		fetchCodes();
	}, [selectedBatchId, currentPage, limit]);

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
		<div className="w-full min-h-screen bg-gray-100">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto flex flex-col items-center">
				<GenerateCodeForm
					onGenerationSuccess={handleGenerationSuccess}
					existingBatches={batches}
				/>

				{batches && batches.length > 0 ? (
					<div className="w-full">
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
									value={selectedBatchId}
									onChange={(e) => {
										setSelectedBatchId(e.target.value);
										setCurrentPage(1); // Reset to first page on batch change
									}}
									className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
								>
									{batches.map((batch) => (
										<option
											key={batch._id}
											value={batch._id}
										>
											{batch.batchNumber}
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

						<div className="flex flex-col">
							{selectedBatchDetails && (
								<div className="mb-6">
									<h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
										Batch Analytics
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 py-4 divide-x divide-gray-200">
										<StatCard
											icon={
												<Hash className="text-indigo-600" />
											}
											label="Total Codes"
											value={
												selectedBatchDetails.totalCodes
											}
											color="bg-indigo-100"
										/>
										<StatCard
											icon={
												<DollarSign className="text-green-600" />
											}
											label="Cost Per Code"
											value={`${currency} ${selectedBatchDetails.costPerCode}`}
											color="bg-green-100"
										/>
										<StatCard
											icon={
												<Gift className="text-pink-600" />
											}
											label="Winning Prize"
											value={`${currency} ${selectedBatchDetails.winningPrize}`}
											color="bg-pink-100"
										/>
										<StatCard
											icon={
												<TrendingUp className="text-blue-600" />
											}
											label="Total Revenue"
											value={`${currency} ${selectedBatchDetails.totalRevenue}`}
											color="bg-blue-100"
										/>
										<StatCard
											icon={
												<Percent className="text-yellow-600" />
											}
											label="Giveaway"
											value={`${selectedBatchDetails.giveawayPercentage}%`}
											color="bg-yellow-100"
										/>
									</div>
								</div>
							)}
							{codes && codes.length > 0 ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
									{codes.map((code) => (
										<CodeCard key={code._id} code={code} />
									))}
								</div>
							) : (
								<div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
									<p className="text-gray-600">
										No codes found for this batch.
									</p>
								</div>
							)}
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
				) : (
					<div className="text-center py-10 px-4 mt-8 bg-white shadow-md rounded-lg w-full max-w-md">
						<h2 className="text-xl font-semibold text-gray-800 mb-2">
							No Batches Found
						</h2>
						<p className="text-gray-600">
							Use the form above to generate your first batch of
							scratch codes.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Codes;
