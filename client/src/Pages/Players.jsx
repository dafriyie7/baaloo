import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/api";
import StatCard from "../Components/StatCard";
import { Users, Trophy, Annoyed } from "lucide-react";
import { useAppcontext } from "../context/AppContext";

const Players = () => {
	const [players, setPlayers] = useState([]);
	const [loserCount, setLoserCount] = useState(0);
	const [winnerCount, setWinnerCount] = useState(0);
	const { setIsLoading } = useAppcontext();

	// fetch all players
	const fetchPlayers = async () => {
		setIsLoading(true);
		try {
			const { data } = await axiosInstance.get("/players/get");

			if (data.success) {
				setPlayers(data.data.players);
				setLoserCount(data.data.losersCount);
				setWinnerCount(data.data.winnersCount);
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

	useEffect(() => {
		fetchPlayers();
	}, []);

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		return new Date(dateString).toLocaleString("en-US", {
			dateStyle: "medium",
			timeStyle: "short",
		});
	};

	return (
		<div className="w-full min-h-screen bg-gray-100">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto">
				<div className="w-full flex justify-center mb-8">
					<h1 className="text-3xl font-bold text-gray-800">
						Players List
					</h1>
				</div>
				{/* stats */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10 py-2 divide-x divide-gray-200">
					<StatCard
						icon={<Users className="text-blue-600" size={24} />}
						label="Total Players"
						value={players.length}
						color="bg-blue-100"
					/>
					<StatCard
						icon={<Trophy className="text-green-600" size={24} />}
						label="Winners"
						value={winnerCount}
						color="bg-green-100"
					/>
					<StatCard
						icon={<Annoyed className="text-red-600" size={24} />}
						label="Losers"
						value={loserCount}
						color="bg-red-100"
					/>
				</div>
				<div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
					<div className="hidden sm:block overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead>
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Name
									</th>
									<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Phone Number
									</th>
									<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Batch
									</th>
									<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Redeemed At
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status / Prize
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{players && players.length > 0 ? (
									players.map((player) => (
										<tr
											key={player._id}
											className="hover:bg-gray-50 transition-colors"
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{player.name}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
												{player.phone}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
												{player.code?.batchNumber
													?.batchNumber || "N/A"}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
												{formatDate(
													player.code?.redeemedAt
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-right">
												{player.code?.isWinner ? (
													<span className="font-semibold text-green-600">
														GH₵{" "}
														{player.code.batchNumber.winningPrize.toFixed(
															2
														)}
													</span>
												) : (
													<p className="font-semibold text-red-500">
														Lost
													</p>
												)}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan="5"
											className="px-6 py-10 text-center text-gray-500"
										>
											No players have scanned yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
					{/* Mobile Card View */}
					<div className="sm:hidden space-y-4">
						{players && players.length > 0 ? (
							players.map((player) => (
								<div
									key={player._id}
									className="p-4 border border-gray-200 rounded-lg"
								>
									<div className="flex justify-between items-start">
										<p className="font-bold text-gray-900">
											{player.name}
										</p>
										{player.code?.isWinner ? (
											<span className="font-semibold text-green-600">
												GH₵{" "}
												{player.code.batchNumber.winningPrize.toFixed(
													2
												)}
											</span>
										) : (
											<p className="font-semibold text-red-500">
												Lost
											</p>
										)}
									</div>
									<div className="mt-2 text-sm text-gray-500 space-y-1">
										<p>
											<span className="font-medium">
												Phone:
											</span>{" "}
											{player.phone}
										</p>
										<p>
											<span className="font-medium">
												Batch:
											</span>{" "}
											{player.code?.batchNumber
												?.batchNumber || "N/A"}
										</p>
										<p>
											<span className="font-medium">
												Redeemed:
											</span>{" "}
											{formatDate(
												player.code?.redeemedAt
											)}
										</p>
									</div>
								</div>
							))
						) : (
							<p className="text-center text-gray-500 py-6">
								No players have scanned yet.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Players;
