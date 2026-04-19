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
	Clock,
	History,
	User,
	Globe,
} from "lucide-react";
import axios from "../../../lib/api";
import AdminEditModal from "../../Components/admin/AdminEditModal";
import AdminPageHeading from "../../Components/admin/AdminPageHeading";
import AdminHeader from "../../Components/admin/AdminHeader";

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
	const [recentLogs, setRecentLogs] = useState([]);
	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [selectedAdmin, setSelectedAdmin] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [systemSettings, setSystemSettings] = useState({
		payoutsEnabled: true,
		maintenanceMode: false,
		allowNewRedemptions: true
	});

	const fetchSystemSettings = async () => {
		try {
			const { data } = await axios.get("/system/settings");
			if (data.success) {
				setSystemSettings(data.settings);
			}
		} catch (error) {
			console.error("Failed to fetch system settings", error);
		}
	};

	const fetchManagementData = async () => {
		setIsLoading(true);
		try {
			const { data } = await axios.get("/auth/stats");

			if (data.success) {
				setStats(data.data.stats);
				setAdmins(data.data.admins);
				setRecentLogs(data.data.recentLogs || []);
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
		fetchSystemSettings();
	}, []);

	const toggleSetting = async (key, value) => {
		try {
			const { data } = await axios.put("/system/settings", { [key]: value });
			if (data.success) {
				setSystemSettings(data.settings);
				toast.success(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated successfully`);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update setting");
		}
	};

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
				<AdminHeader 
					title={`Welcome, ${user?.name || "Admin"}!`}
					subtitle="Revenue and pools from batches, plus admin access."
					icon={LayoutDashboard}
					actions={[
						{ label: "View Logs", icon: History, onClick: () => navigate("/admin/logs"), variant: 'dark' }
					]}
				/>

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


				{/* System Controls Section */}
				<section className="mb-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm ring-1 ring-black/[0.03]">
					<div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-6 py-5">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-md">
								<Shield size={20} strokeWidth={2.5} />
							</div>
							<div>
								<h2 className="text-lg font-bold text-stone-900">System Controls</h2>
								<p className="text-xs font-medium text-stone-500 mt-0.5">Global overrides for application features.</p>
							</div>
						</div>
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-widest border border-amber-200">
							<Globe size={12} /> Live Status
						</div>
					</div>
					
					<div className="p-6 grid gap-6 md:grid-cols-3">
						{/* Payout Toggle */}
						<div className={`group relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300 ${systemSettings.payoutsEnabled ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
							<div className="flex items-center justify-between mb-4">
								<div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${systemSettings.payoutsEnabled ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
									<Banknote size={20} />
								</div>
								<button 
									onClick={() => toggleSetting('payoutsEnabled', !systemSettings.payoutsEnabled)}
									className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${systemSettings.payoutsEnabled ? 'bg-emerald-500' : 'bg-rose-500'}`}
								>
									<span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${systemSettings.payoutsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
								</button>
							</div>
							<h3 className="font-bold text-stone-900">Payout Processing</h3>
							<p className="text-xs text-stone-500 mt-1">Enable or block all automatic prize disbursements.</p>
							<div className={`mt-4 inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${systemSettings.payoutsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
								{systemSettings.payoutsEnabled ? 'Allowing Payouts' : 'Payouts Blocked'}
							</div>
						</div>

						{/* Redemption Toggle */}
						<div className={`group relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300 ${systemSettings.allowNewRedemptions ? 'border-amber-100 bg-amber-50/30' : 'border-stone-100 bg-stone-50/30'}`}>
							<div className="flex items-center justify-between mb-4">
								<div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${systemSettings.allowNewRedemptions ? 'bg-amber-500 text-white' : 'bg-stone-400 text-white'}`}>
									<Hash size={20} />
								</div>
								<button 
									onClick={() => toggleSetting('allowNewRedemptions', !systemSettings.allowNewRedemptions)}
									className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${systemSettings.allowNewRedemptions ? 'bg-amber-500' : 'bg-stone-300'}`}
								>
									<span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${systemSettings.allowNewRedemptions ? 'translate-x-6' : 'translate-x-1'}`} />
								</button>
							</div>
							<h3 className="font-bold text-stone-900">New Scans</h3>
							<p className="text-xs text-stone-500 mt-1">Allow users to scan and validate new tickets.</p>
							<div className={`mt-4 inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${systemSettings.allowNewRedemptions ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-600'}`}>
								{systemSettings.allowNewRedemptions ? 'Active' : 'Paused'}
							</div>
						</div>

						{/* Maintenance Toggle */}
						<div className={`group relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300 ${systemSettings.maintenanceMode ? 'border-orange-200 bg-orange-50' : 'border-stone-100 bg-stone-50/30'}`}>
							<div className="flex items-center justify-between mb-4">
								<div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${systemSettings.maintenanceMode ? 'bg-orange-600 text-white' : 'bg-stone-400 text-white'}`}>
									<Shield size={20} />
								</div>
								<button 
									onClick={() => toggleSetting('maintenanceMode', !systemSettings.maintenanceMode)}
									className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${systemSettings.maintenanceMode ? 'bg-orange-600' : 'bg-stone-300'}`}
								>
									<span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
								</button>
							</div>
							<h3 className="font-bold text-stone-900">Maintenance Mode</h3>
							<p className="text-xs text-stone-500 mt-1">Locks the entire site for non-admin users.</p>
							<div className={`mt-4 inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${systemSettings.maintenanceMode ? 'bg-orange-200 text-orange-800' : 'bg-stone-200 text-stone-600'}`}>
								{systemSettings.maintenanceMode ? 'Under Maintenance' : 'Public Access'}
							</div>
						</div>
					</div>
				</section>

				{/* Recent Activity Card */}
				<section className="mb-10 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm ring-1 ring-black/[0.03]">
					<div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-5 py-4">
						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-900 shadow-sm">
								<History size={18} strokeWidth={2.5} />
							</div>
							<h2 className="text-base font-bold text-stone-900">Recent System Activity</h2>
						</div>
						<button 
							onClick={() => navigate("/admin/logs")}
							className="text-xs font-bold text-amber-800 hover:text-amber-900 transition-colors uppercase tracking-tight"
						>
							View All Logs
						</button>
					</div>
					<div className="divide-y divide-stone-100">
						{recentLogs.length > 0 ? (
							recentLogs.map((log) => (
								<div key={log._id} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-stone-50/50">
									<div className="flex items-center gap-4 min-w-0">
										<div className="flex flex-col">
											<span className="text-xs font-bold text-stone-900 truncate">
												{log.action.replace(/_/g, " ")}
											</span>
											<span className="text-[10px] text-stone-500 flex items-center gap-1">
												<User size={10} /> {log.user?.name || "System"}
											</span>
										</div>
									</div>
									<div className="flex flex-col items-end shrink-0">
										<span className="text-[10px] font-bold text-stone-800 flex items-center gap-1">
											<Clock size={10} className="text-stone-400" />
											{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
										<span className="text-[9px] font-bold text-amber-800/80 flex items-center gap-1">
											<Globe size={9} />
											{log.location || "Unknown"}
										</span>
										<span className="text-[9px] text-stone-400 uppercase tracking-tighter tabular-nums mt-0.5">
											{new Date(log.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
							))
						) : (
							<div className="py-12 text-center text-stone-400">
								<p className="text-sm">No recent activity to show.</p>
							</div>
						)}
					</div>
				</section>

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
