import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../../lib/api";
import StatCard from "../../Components/admin/StatCard";
import { Users, Trophy, Annoyed, Search, X } from "lucide-react";
import { useAppcontext } from "../../context/AppContext";
import AdminPageHeading from "../../Components/admin/AdminPageHeading";

const selectClass =
	"w-full min-w-[10rem] px-3 py-2 border border-amber-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-300 bg-white text-stone-900 text-sm";

const inputClass =
	"w-full min-w-[12rem] flex-1 px-3 py-2 border border-amber-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-300 bg-white text-stone-900 text-sm placeholder:text-stone-400";

const Players = () => {
	const [players, setPlayers] = useState([]);
	const [loserCount, setLoserCount] = useState(0);
	const [winnerCount, setWinnerCount] = useState(0);
	const { setIsLoading, currency } = useAppcontext();

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [batchFilter, setBatchFilter] = useState("all");

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

	const searchTrim = search.trim().toLowerCase();

	const batchOptions = useMemo(() => {
		const map = new Map();
		for (const p of players) {
			const b = p.code?.batchNumber;
			const id = b?._id?.toString();
			if (!id) continue;
			const label =
				typeof b.batchNumber === "string" && b.batchNumber
					? b.batchNumber
					: id.slice(-6);
			if (!map.has(id)) map.set(id, label);
		}
		return Array.from(map.entries())
			.map(([id, label]) => ({ id, label }))
			.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
	}, [players]);

	const filteredPlayers = useMemo(() => {
		return players.filter((p) => {
			if (statusFilter === "winner" && !p.code?.isWinner) return false;
			if (statusFilter === "loser" && p.code?.isWinner) return false;
			if (batchFilter !== "all") {
				const bid = p.code?.batchNumber?._id?.toString();
				if (bid !== batchFilter) return false;
			}
			if (searchTrim) {
				const name = (p.name || "").toLowerCase();
				const phone = (p.phone || "").toLowerCase();
				if (!name.includes(searchTrim) && !phone.includes(searchTrim))
					return false;
			}
			return true;
		});
	}, [players, searchTrim, statusFilter, batchFilter]);

	const displayWinnerCount = useMemo(
		() => filteredPlayers.filter((p) => p.code?.isWinner).length,
		[filteredPlayers]
	);
	const displayLoserCount = filteredPlayers.length - displayWinnerCount;

	const filtersActive =
		searchTrim !== "" ||
		statusFilter !== "all" ||
		batchFilter !== "all";

	const clearFilters = () => {
		setSearch("");
		setStatusFilter("all");
		setBatchFilter("all");
	};

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		return new Date(dateString).toLocaleString("en-US", {
			dateStyle: "medium",
			timeStyle: "short",
		});
	};

	return (
		<div className="w-full">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
				<div className="mb-6 text-center sm:text-left">
					<AdminPageHeading icon={Users}>Players</AdminPageHeading>
					<p className="mt-1 text-stone-600 text-sm sm:text-base">
						Everyone who has scanned a code and claimed or lost.
					</p>
				</div>

				<div className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-100/90 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
					<label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-left">
						<span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
							Search
						</span>
						<span className="relative block">
							<Search
								className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
								strokeWidth={2}
								aria-hidden
							/>
							<input
								type="search"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Name or phone"
								className={`${inputClass} pl-9`}
							/>
						</span>
					</label>
					<label className="flex min-w-[10rem] flex-col gap-1 text-left sm:max-w-[11rem]">
						<span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
							Outcome
						</span>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className={selectClass}
						>
							<option value="all">All</option>
							<option value="winner">Winners</option>
							<option value="loser">Losers</option>
						</select>
					</label>
					<label className="flex min-w-[10rem] flex-col gap-1 text-left sm:max-w-[14rem]">
						<span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
							Batch
						</span>
						<select
							value={batchFilter}
							onChange={(e) => setBatchFilter(e.target.value)}
							className={selectClass}
						>
							<option value="all">All batches</option>
							{batchOptions.map(({ id, label }) => (
								<option key={id} value={id}>
									{label}
								</option>
							))}
						</select>
					</label>
					{filtersActive ? (
						<button
							type="button"
							onClick={clearFilters}
							className="inline-flex items-center justify-center gap-1.5 self-stretch rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 sm:self-auto sm:shrink-0"
						>
							<X className="h-4 w-4" strokeWidth={2} />
							Clear
						</button>
					) : null}
				</div>

				<p className="mb-3 text-center text-xs text-stone-500 sm:text-left">
					{filtersActive ? (
						<>
							Showing{" "}
							<span className="font-semibold text-stone-700">
								{filteredPlayers.length}
							</span>{" "}
							of {players.length} players
							<span className="text-stone-400"> · </span>
							<span className="text-stone-400">
								Global totals: {winnerCount} winners, {loserCount}{" "}
								losers
							</span>
						</>
					) : (
						<>
							Full list ({players.length} players, {winnerCount} winners,{" "}
							{loserCount} losers)
						</>
					)}
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
					<StatCard
						icon={<Users strokeWidth={2} />}
						label={filtersActive ? "Matching players" : "Total players"}
						value={filtersActive ? filteredPlayers.length : players.length}
						color="bg-amber-50 text-amber-700"
					/>
					<StatCard
						icon={<Trophy strokeWidth={2} />}
						label={filtersActive ? "Winners (filtered)" : "Winners"}
						value={filtersActive ? displayWinnerCount : winnerCount}
						color="bg-emerald-50 text-emerald-700"
					/>
					<StatCard
						icon={<Annoyed strokeWidth={2} />}
						label={filtersActive ? "Losers (filtered)" : "Losers"}
						value={filtersActive ? displayLoserCount : loserCount}
						color="bg-stone-200 text-stone-700"
					/>
				</div>
				<div className="bg-white p-4 sm:p-6 rounded-md border border-amber-100/80 shadow-sm overflow-hidden">
					<div className="hidden sm:block overflow-x-auto">
						<table className="min-w-full divide-y divide-amber-100">
							<thead>
								<tr className="bg-amber-50/50">
									<th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">
										Name
									</th>
									<th className="px-6 py-3 text-center text-xs font-semibold text-stone-600 uppercase tracking-wider">
										Phone
									</th>
									<th className="px-6 py-3 text-center text-xs font-semibold text-stone-600 uppercase tracking-wider">
										Batch
									</th>
									<th className="px-6 py-3 text-center text-xs font-semibold text-stone-600 uppercase tracking-wider">
										Redeemed
									</th>
									<th className="px-6 py-3 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">
										Status / prize
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-amber-50">
								{filteredPlayers && filteredPlayers.length > 0 ? (
									filteredPlayers.map((player) => (
										<tr
											key={player._id}
											className="hover:bg-amber-50/30 transition-colors"
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
												{player.name}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 text-center">
												{player.phone}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 text-center font-mono text-xs">
												{player.code?.batchNumber
													?.batchNumber || "N/A"}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 text-center">
												{formatDate(
													player.code?.redeemedAt
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-right">
												{player.code?.isWinner ? (
													<span className="font-semibold text-emerald-700">
														{currency}{" "}
														{Number(
															player.code
																.prizeAmount ??
																player.code
																	.batchNumber
																	?.winningPrize ??
																0
														).toFixed(2)}
													</span>
												) : (
													<p className="font-semibold text-rose-600">
														Lost
													</p>
												)}
											</td>
										</tr>
									))
								) : players.length > 0 ? (
									<tr>
										<td
											colSpan="5"
											className="px-6 py-12 text-center text-stone-500"
										>
											No players match these filters.
										</td>
									</tr>
								) : (
									<tr>
										<td
											colSpan="5"
											className="px-6 py-12 text-center text-stone-500"
										>
											No players have scanned yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
					<div className="sm:hidden space-y-3">
						{filteredPlayers && filteredPlayers.length > 0 ? (
							filteredPlayers.map((player) => (
								<div
									key={player._id}
									className="p-4 border border-amber-100 rounded-md bg-stone-50/50"
								>
									<div className="flex justify-between items-start gap-2">
										<p className="font-bold text-stone-900">
											{player.name}
										</p>
										{player.code?.isWinner ? (
											<span className="font-semibold text-emerald-700 shrink-0">
												{currency}{" "}
												{Number(
													player.code.prizeAmount ??
														player.code.batchNumber
															?.winningPrize ??
														0
												).toFixed(2)}
											</span>
										) : (
											<p className="font-semibold text-rose-600 shrink-0">
												Lost
											</p>
										)}
									</div>
									<div className="mt-2 text-sm text-stone-600 space-y-1">
										<p>
											<span className="font-medium text-stone-700">
												Phone:
											</span>{" "}
											{player.phone}
										</p>
										<p>
											<span className="font-medium text-stone-700">
												Batch:
											</span>{" "}
											{player.code?.batchNumber
												?.batchNumber || "N/A"}
										</p>
										<p>
											<span className="font-medium text-stone-700">
												Redeemed:
											</span>{" "}
											{formatDate(
												player.code?.redeemedAt
											)}
										</p>
									</div>
								</div>
							))
						) : players.length > 0 ? (
							<p className="text-center text-stone-500 py-8">
								No players match these filters.
							</p>
						) : (
							<p className="text-center text-stone-500 py-8">
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
