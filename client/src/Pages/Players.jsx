import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/api";

const Players = () => {
	const [players, setPlayers] = useState([]);
	const [loserCount, setLoserCount] = useState(0);
	const [winnerCount, setWinnerCount] = useState(0);

	// fetch all winners
	const fetchWinners = async () => {
		try {
			const { data } = await axiosInstance.get("/players/get");

			if (data.success) {
				setPlayers(data.data.players);
				setLoserCount(data.data.losersCount);
				setWinnerCount(data.data.winnersCount);
				toast.success("Winners fetched successfully");
			} else {
				console.log(data.message);
				toast.error(data.message);
			}

			console.log(data);
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

	useEffect(() => {
		fetchWinners();
	}, []);

	return (
		<div className="w-full min-h-screen bg-gray-100">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-4xl mx-auto">
				<div className="w-full flex justify-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-6">
						Players List
					</h1>
				</div>
				{/* stats */}
				<div className="w-full max-w-xs mx-auto flex justify-center mb-8">
					<div className="bg-white p-6 rounded-2xl shadow-lg w-full">
						<div className="grid grid-cols-2 items-center gap-y-3">
							<h1 className="font-medium text-gray-500">
								Total Players:
							</h1>
							<h2 className="text-gray-800 text-2xl justify-self-end">
								{players.length}
							</h2>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-green-500 rounded-full"></div>
								<h1 className="font-medium text-gray-500">
									Winners
								</h1>
							</div>
							<h2 className="justify-self-end">
								{winnerCount}
							</h2>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-red-500 rounded-full"></div>
								<h1 className="font-medium text-gray-500">
									Losers
								</h1>
							</div>
							<h2 className="justify-self-end">
								{loserCount}
							</h2>
						</div>
					</div>
				</div>
				<div className="bg-white p-8 rounded-2xl shadow-lg">
					<div className="overflow-x-auto px-5">
						<table className="min-w-full border-separate border-spacing-y-3">
							<thead>
								<tr>
									<th className="px-6 py-3 text-left text-base font-bold text-gray-600 uppercase tracking-wider">
										Name
									</th>
									<th className="px-6 py-3 text-center text-base text-gray-600 font-bold uppercase tracking-wider">
										Phone Number
									</th>
									<th className="px-6 py-3 text-right text-base text-gray-600 font-bold uppercase tracking-wider">
										Prize
									</th>
								</tr>
							</thead>
							<tbody>
								{players && players.length > 0 ? (
									players.map((player) => (
										<tr
											key={player._id}
											className="bg-white shadow-sm rounded-full hover:scale-105 transition-transform duration-300"
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 rounded-l-full">
												{player.name}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
												{player.phone}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 rounded-r-full text-right">
												{player.code.prize ? (
													<p className="text-green-600">
														Prize
													</p>
												) : (
													<p className="text-red-500">
														No Prize
													</p>
												)}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan="3"
											className="px-6 py-10 text-center text-gray-500"
										>
											No players have scanned yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Players;
