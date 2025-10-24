import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAppcontext } from "../../context/AppContext";
import StatCard from "../../Components/admin/StatCard";
import { Shield, Hash, Users, UserPlus } from "lucide-react";
import axios from "../../../lib/api";
import AdminEditModal from "../../Components/admin/AdminEditModal";

const Manage = () => {
	const { user, setIsLoading } = useAppcontext();

	const [stats, setStats] = useState({
		totalBatches: 0,
		totalCodes: 0,
		totalPlayers: 0,
		totalAdmins: 0,
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

	const handleUpdateAdmin = (updatedAdmin) => {
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
					`Invite sent to ${newName}! They can now log in.`
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
		<div className="w-full min-h-screen bg-gray-100">
			<div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-800">
						Welcome, {user?.name}!
					</h1>
					<p className="text-gray-600">
						Here's an overview of your application.
					</p>
				</div>

				{/* Stats Overview */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
					<StatCard
						label="Total Batches"
						value={stats.totalBatches}
						icon={<Hash className="text-indigo-600" />}
						color="bg-indigo-100"
					/>
					<StatCard
						label="Total Codes"
						value={stats.totalCodes.toLocaleString()}
						icon={<Hash className="text-blue-600" />}
						color="bg-blue-100"
					/>
					<StatCard
						label="Total Players"
						value={stats.totalPlayers.toLocaleString()}
						icon={<Users className="text-green-600" />}
						color="bg-green-100"
					/>
					<StatCard
						label="Admins"
						value={stats.totalAdmins}
						icon={<Shield className="text-red-600" />}
						color="bg-red-100"
					/>
				</div>

				{/* Admin Management Section */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Admin List */}
					<div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
						<h2 className="text-xl font-bold text-gray-800 mb-4">
							Administrators
						</h2>
						<ul className="space-y-3">
							{admins.map((admin) => (
								<li
									key={admin.email}
									className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm"
								>
									<div>
										<p className="font-semibold text-gray-800">
											{admin.name}
										</p>
										<p className="text-sm text-gray-600">
											{admin.email}
										</p>
									</div>
									<button
										onClick={() => handleOpenModal(admin)}
										className="text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 px-4 py-2 rounded-full"
									>
										Manage
									</button>
								</li>
							))}
						</ul>
					</div>

					{/* Add New Admin Form */}
					<div className="bg-white p-6 rounded-2xl shadow-lg">
						<h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
							<UserPlus size={24} />
							Add New Admin
						</h2>
						<form onSubmit={handleAddAdmin} className="space-y-4">
							<input
								type="text"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="Full Name"
								required
								className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
							/>
							<input
								type="email"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								placeholder="Email Address"
								required
								className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
							/>
							<input
								type="text"
								placeholder="Phone Number (optional)"
								value={newPhone}
								onChange={(e) => setNewPhone(e.target.value)}
								className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
							/>
							<input
								type="password"
								placeholder="Password (optional)"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
							/>
							<div className="pt-2">
								<button
									type="submit"
									className="w-full py-3 px-12 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
								>
									Send Invite
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
