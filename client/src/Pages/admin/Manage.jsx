import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAppcontext } from "../../context/AppContext";
import StatCard from "../../Components/admin/StatCard";
import {
	Banknote,
	CircleDollarSign,
	LayoutDashboard,
	PiggyBank,
	PieChart,
	Shield,
	Hash,
	TrendingUp,
	Users,
	UserPlus,
} from "lucide-react";
import axios from "../../../lib/api";
import AdminEditModal from "../../Components/admin/AdminEditModal";
import AdminPageHeading from "../../Components/admin/AdminPageHeading";

const Manage = () => {
	const { user, setIsLoading, navigate, currency } = useAppcontext();

	const [stats, setStats] = useState({
		totalBatches: 0,
		totalCodes: 0,
		totalPlayers: 0,
		totalAdmins: 0,
		totalBookedRevenue: 0,
		totalPrizePoolCommitted: 0,
		stickerMarginBooked: 0,
		totalMarginRetainedPlanned: 0,
		revenueFromRedemptions: 0,
		revenueLast7Days: 0,
		totalPrizePaid: 0,
		netCashFromPlayedTickets: 0,
		realizedVsBookedPct: 0,
		prizePoolShareOfBookedPct: 0,
		stickerShareOfBookedPct: 0,
	});
	const [admins, setAdmins] = useState([]);
	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [selectedAdmin, setSelectedAdmin] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const fetchManagementData = async () => {
		setIsLoading(true);
		try {
			const { data } = await axios.get("/auth/stats");

			if (data.success) {
				setStats(data.data.stats);
				setAdmins(data.data.admins);
			} else {
				toast.error(data.message || "Failed to fetch data.");
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchManagementData();
	}, []);

	const handleOpenModal = (admin) => {
		setSelectedAdmin(admin);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setSelectedAdmin(null);
		setIsModalOpen(false);
	};

	const handleUpdateAdmin = async (updatedAdmin) => {
		setAdmins(
			admins.map((admin) =>
				admin._id === updatedAdmin._id ? updatedAdmin : admin
			)
		);
	};

	const handleRemoveAdmin = (adminId) => {
		setAdmins(admins.filter((admin) => admin._id !== adminId));
	};

	const handleAddAdmin = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const { data } = await axios.post("/auth/register", {
				name: newName,
				email: newEmail,
				phone: newPhone || "0000000000",
				password: newPassword || "password",
			});
			if (data.success) {
				toast.success(
					`Added ${newName}! They can now log in.`
				);
				fetchManagementData(); // Refetch data to show the new admin
			} else {
				toast.error(data.message || "Failed to add admin.");
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred.");
		} finally {
			setNewName("");
			setNewEmail("");
			setNewPhone("");
			setNewPassword("");
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
				<div className="mb-8">
					<AdminPageHeading icon={LayoutDashboard}>
						Welcome, {user?.name || "Admin"}!
					</AdminPageHeading>
					<p className="mt-1 text-stone-600 text-sm sm:text-base">
						Revenue and pools from batches, plus admin access.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
					<StatCard
						label="Total Batches"
						value={stats.totalBatches}
						icon={<Hash strokeWidth={2} />}
						color="bg-amber-50 text-amber-700"
						handleClick={() => navigate("/admin/codes")}
					/>
					<StatCard
						label="Total Codes"
						value={stats.totalCodes.toLocaleString()}
						icon={<Hash strokeWidth={2} />}
						color="bg-amber-50 text-amber-800"
						handleClick={() => navigate("/admin/codes")}
					/>
					<StatCard
						label="Total Players"
						value={stats.totalPlayers.toLocaleString()}
						icon={<Users strokeWidth={2} />}
						color="bg-emerald-50 text-emerald-700"
						handleClick={() => navigate("/admin/players")}
					/>
					<StatCard
						label="Admins"
						value={stats.totalAdmins}
						icon={<Shield strokeWidth={2} />}
						color="bg-stone-200 text-stone-800"
					/>
				</div>

				<section className="mb-10 rounded-lg border border-amber-100/90 bg-white p-5 shadow-sm sm:p-6">
					<div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h2 className="text-lg font-bold text-stone-900 sm:text-xl">
								Revenue &amp; prize pools
							</h2>
							<p className="text-sm text-stone-500">
								Booked sticker capacity per batch vs money collected on played
								tickets and prizes paid out.
							</p>
						</div>
						<p className="text-xs font-medium uppercase tracking-wide text-stone-400">
							All batches, {currency}
						</p>
					</div>

					<div className="mb-6">
						<div className="mb-1 flex items-baseline justify-between gap-2">
							<span className="text-sm font-semibold text-stone-700">
								Realized revenue vs booked gross
							</span>
							<span className="text-sm font-bold tabular-nums text-amber-900">
								{stats.realizedVsBookedPct}%
							</span>
						</div>
						<div
							className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100"
							role="img"
							aria-label={`${stats.realizedVsBookedPct} percent of booked gross collected from played tickets`}
						>
							<div
								className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-500 transition-[width] duration-500"
								style={{
									width: `${Math.min(100, Math.max(0, stats.realizedVsBookedPct))}%`,
								}}
							/>
						</div>
						<p className="mt-1.5 text-xs text-stone-500">
							{currency}{" "}
							{Number(stats.revenueFromRedemptions ?? 0).toLocaleString(
								undefined,
								{
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
								}
							)}{" "}
							from redemptions vs {currency}{" "}
							{Number(stats.totalBookedRevenue ?? 0).toLocaleString(undefined, {
								minimumFractionDigits: 0,
								maximumFractionDigits: 2,
							})}{" "}
							booked at batch creation (price × codes).
						</p>
					</div>

					<div className="mb-6">
						<div className="mb-1 flex items-baseline justify-between gap-2">
							<span className="text-sm font-semibold text-stone-700">
								Booked revenue split
							</span>
							<span className="text-xs text-stone-500">
								Giveaway pool {stats.prizePoolShareOfBookedPct}% · House share
								of sticker {stats.stickerShareOfBookedPct}%
							</span>
						</div>
						<div className="flex h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
							<div
								className="bg-emerald-500 transition-[width] duration-500"
								style={{
									width: `${Math.min(100, Math.max(0, stats.prizePoolShareOfBookedPct))}%`,
								}}
								title="Committed prize pool"
							/>
							<div
								className="bg-stone-500 transition-[width] duration-500"
								style={{
									width: `${Math.min(100, Math.max(0, stats.stickerShareOfBookedPct))}%`,
								}}
								title="Non-giveaway slice of sticker"
							/>
						</div>
						<p className="mt-1.5 text-xs text-stone-500">
							Pool budget {currency}{" "}
							{Number(stats.totalPrizePoolCommitted ?? 0).toLocaleString(
								undefined,
								{
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
								}
							)}
							{" · "}
							House slice of sticker {currency}{" "}
							{Number(stats.stickerMarginBooked ?? 0).toLocaleString(undefined, {
								minimumFractionDigits: 0,
								maximumFractionDigits: 2,
							})}
						</p>
					</div>

					<div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
						<div className="rounded-md border border-amber-50 bg-stone-50/80 p-4">
							<div className="mb-2 flex items-center gap-2 text-stone-500">
								<Banknote className="h-4 w-4 shrink-0" strokeWidth={2} />
								<span className="text-xs font-semibold uppercase tracking-wide">
									Booked gross
								</span>
							</div>
							<p className="text-xl font-bold tabular-nums text-stone-900 sm:text-2xl">
								{currency}{" "}
								{Number(stats.totalBookedRevenue ?? 0).toLocaleString(
									undefined,
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 2,
									}
								)}
							</p>
							<p className="mt-0.5 text-xs text-stone-500">
								Σ (codes × price) when batches were generated
							</p>
						</div>
						<div className="rounded-md border border-amber-50 bg-stone-50/80 p-4">
							<div className="mb-2 flex items-center gap-2 text-stone-500">
								<TrendingUp className="h-4 w-4 shrink-0" strokeWidth={2} />
								<span className="text-xs font-semibold uppercase tracking-wide">
									Revenue in (plays)
								</span>
							</div>
							<p className="text-xl font-bold tabular-nums text-stone-900 sm:text-2xl">
								{currency}{" "}
								{Number(stats.revenueFromRedemptions ?? 0).toLocaleString(
									undefined,
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 2,
									}
								)}
							</p>
							<p className="mt-0.5 text-xs text-stone-500">
								Σ ticket price on redeemed codes
							</p>
						</div>
						<div className="rounded-md border border-amber-50 bg-stone-50/80 p-4">
							<div className="mb-2 flex items-center gap-2 text-stone-500">
								<CircleDollarSign
									className="h-4 w-4 shrink-0"
									strokeWidth={2}
								/>
								<span className="text-xs font-semibold uppercase tracking-wide">
									Last 7 days
								</span>
							</div>
							<p className="text-xl font-bold tabular-nums text-stone-900 sm:text-2xl">
								{currency}{" "}
								{Number(stats.revenueLast7Days ?? 0).toLocaleString(undefined, {
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
								})}
							</p>
							<p className="mt-0.5 text-xs text-stone-500">
								Ticket value from redemptions this week
							</p>
						</div>
						<div className="rounded-md border border-amber-50 bg-stone-50/80 p-4">
							<div className="mb-2 flex items-center gap-2 text-stone-500">
								<PieChart className="h-4 w-4 shrink-0" strokeWidth={2} />
								<span className="text-xs font-semibold uppercase tracking-wide">
									Prizes paid
								</span>
							</div>
							<p className="text-xl font-bold tabular-nums text-stone-900 sm:text-2xl">
								{currency}{" "}
								{Number(stats.totalPrizePaid ?? 0).toLocaleString(undefined, {
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
								})}
							</p>
							<p className="mt-0.5 text-xs text-stone-500">
								Winning tickets only (redeemed)
							</p>
						</div>
						<div className="rounded-md border border-amber-50 bg-stone-50/80 p-4">
							<div className="mb-2 flex items-center gap-2 text-stone-500">
								<Hash className="h-4 w-4 shrink-0" strokeWidth={2} />
								<span className="text-xs font-semibold uppercase tracking-wide">
									Net (plays − prizes)
								</span>
							</div>
							<p
								className={`text-xl font-bold tabular-nums sm:text-2xl ${
									Number(stats.netCashFromPlayedTickets) >= 0
										? "text-emerald-800"
										: "text-rose-700"
								}`}
							>
								{currency}{" "}
								{Number(stats.netCashFromPlayedTickets ?? 0).toLocaleString(
									undefined,
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 2,
									}
								)}
							</p>
							<p className="mt-0.5 text-xs text-stone-500">
								Cash-in from plays minus prize outflow
							</p>
						</div>
						<div className="rounded-md border border-amber-50 bg-stone-50/80 p-4">
							<div className="mb-2 flex items-center gap-2 text-stone-500">
								<PiggyBank className="h-4 w-4 shrink-0" strokeWidth={2} />
								<span className="text-xs font-semibold uppercase tracking-wide">
									Pool margin (plan)
								</span>
							</div>
							<p className="text-xl font-bold tabular-nums text-stone-900 sm:text-2xl">
								{currency}{" "}
								{Number(
									stats.totalMarginRetainedPlanned ?? 0
								).toLocaleString(undefined, {
									minimumFractionDigits: 0,
									maximumFractionDigits: 2,
								})}
							</p>
							<p className="mt-0.5 text-xs text-stone-500">
								Rounding / unused slice of prize budget (per batch design)
							</p>
						</div>
					</div>
				</section>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
					<div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-md border border-amber-100/80 shadow-sm">
						<h2 className="text-xl font-bold text-stone-900 mb-1">
							Administrators
						</h2>
						<p className="text-sm text-stone-500 mb-5">
							Who can access this dashboard.
						</p>
						{admins.length === 0 ? (
							<div className="rounded-md border border-dashed border-amber-200 bg-amber-50/40 py-12 px-4 text-center">
								<p className="text-stone-600">No admins to display.</p>
							</div>
						) : (
							<ul className="space-y-3">
								{admins.map((admin) => (
									<li
										key={admin.email}
										className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-stone-50/80 rounded-md border border-amber-100/60"
									>
										<div className="min-w-0">
											<p className="font-semibold text-stone-900">
												{admin.name}
											</p>
											<p className="text-sm text-stone-600 truncate">
												{admin.email}
											</p>
										</div>
										<button
											type="button"
											onClick={() =>
												handleOpenModal(admin)
											}
											className="text-sm font-medium text-white bg-amber-800 hover:bg-amber-700 px-4 py-2 rounded-md shrink-0 transition-colors"
										>
											Manage
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="bg-white p-6 sm:p-8 rounded-md border border-amber-100/80 shadow-sm">
						<h2 className="text-xl font-bold text-stone-900 mb-1 flex items-center gap-2">
							<UserPlus
								className="text-amber-800 shrink-0"
								size={24}
								strokeWidth={2}
							/>
							Add admin
						</h2>
						<p className="text-sm text-stone-500 mb-5">
							New admins can sign in with the email you add.
						</p>
						<form onSubmit={handleAddAdmin} className="space-y-4">
							<input
								type="text"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="Full name"
								required
								className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
							/>
							<input
								type="email"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								placeholder="Email address"
								required
								className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
							/>
							<input
								type="text"
								placeholder="Phone (optional)"
								value={newPhone}
								onChange={(e) => setNewPhone(e.target.value)}
								className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
							/>
							<input
								type="password"
								placeholder="Password (optional)"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
							/>
							<div className="pt-2">
								<button
									type="submit"
									className="w-full py-3 px-6 rounded-md text-sm font-semibold text-white bg-amber-800 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-700 transition-colors"
								>
									Add admin
								</button>
							</div>
						</form>
					</div>
				</div>

				<AdminEditModal
					isOpen={isModalOpen}
					onClose={handleCloseModal}
					admin={selectedAdmin}
					onUpdate={handleUpdateAdmin}
					onRemove={handleRemoveAdmin}
				/>
			</div>
		</div>
	);
};

export default Manage;
