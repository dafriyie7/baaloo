import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const AdminEditModal = ({ admin, isOpen, onClose, onUpdate, onRemove }) => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [newPassword, setNewPassword] = useState("");

	useEffect(() => {
		if (admin) {
			setName(admin.name || "");
			setEmail(admin.email || "");
			setPhone(admin.phone || "");
		}
	}, [admin]);

	if (!isOpen || !admin) return null;

	const handleProfileUpdate = (e) => {
		e.preventDefault();
		// TODO: API call to update user details
		onUpdate({ ...admin, name, email, phone });
		toast.success("Admin details updated!");
		onClose();
	};

	const handlePasswordChange = (e) => {
		e.preventDefault();
		if (!newPassword) {
			toast.error("New password cannot be empty.");
			return;
		}
		// TODO: API call to update user password
		toast.success(`Password for ${admin.name} has been updated!`);
		setNewPassword("");
		onClose();
	};

	const handleRemove = () => {
		if (window.confirm(`Are you sure you want to remove ${admin.name}?`)) {
			// TODO: API call to delete user
			onRemove(admin._id);
			toast.success(`${admin.name} has been removed.`);
			onClose();
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-lg relative space-y-8">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
				>
					<X size={24} />
				</button>

				{/* Update Profile Section */}
				<div>
					<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
						Manage: {admin.name}
					</h2>
					<form
						onSubmit={handleProfileUpdate}
						className="w-full space-y-4 text-left"
					>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Full Name"
							className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						/>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email Address"
							className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						/>
						<input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="Phone Number"
							className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						/>
						<div className="pt-2 w-full flex justify-center">
							<button
								type="submit"
								className="w-full py-3 px-12 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
							>
								Save Details
							</button>
						</div>
					</form>
				</div>

				{/* Change Password Section */}
				<div>
					<h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
						Reset Password
					</h3>
					<form
						onSubmit={handlePasswordChange}
						className="w-full space-y-4 text-left"
					>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="Enter new password"
							required
							className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						/>
						<div className="pt-2 w-full flex justify-center">
							<button
								type="submit"
								className="w-full py-3 px-12 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Update Password
							</button>
						</div>
					</form>
				</div>

				{/* Danger Zone */}
				<div className="border-t pt-6">
					<button
						onClick={handleRemove}
						className="w-full py-3 px-12 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
					>
						Remove Admin
					</button>
				</div>
			</div>
		</div>
	);
};

export default AdminEditModal;
