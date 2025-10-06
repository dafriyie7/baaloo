import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/api";


const Players = () => {
	const [players, setPlayers] = useState([]);

	// fetch all winners
	const fetchWinners = async () => {
		try {
			const { data } = await axiosInstance.get("/winners/get");

			if (data.success) {
				setPlayers(data.data);
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
		fetchWinners()
	},[])

	return (
		<div className="p-4 sm:p-6 lg:p-8 w-full max-w-4xl mx-auto">
			<div className="w-full flex justify-center">
				<h1 className="text-2xl font-bold text-gray-900 mb-6">
					Redeemers List
				</h1>
			</div>
			<div className="w-full flex justify-center">
				<div className="bg-white w-30 py-5 rounded-xl flex items-center justify-center gap-5 shadow-md">
					<h1>Winners</h1>
					<h2 className="text-gray-600">{players.length}</h2>
				</div>
			</div>
			<div className="overflow-x-auto p-5">
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
									key={player.id}
									className="bg-white shadow-sm rounded-lg hover:scale-105 transition-transform duration-300"
								>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 rounded-l-lg">
										{player.name}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
										{player.phone}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 rounded-r-lg text-right">
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
									colSpan="2"
									className="px-6 py-4 text-center text-sm text-gray-500"
								>
									No players scanned yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export default Players