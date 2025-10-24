import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import axios from "../../../lib/api";
import { useAppcontext } from "../../context/AppContext";

const AdminEditModal = ({ admin, isOpen, onClose, onUpdate, onRemove }) => {
	const [name, setName] = useState("");
	const { user: currentUser, setIsLoading } = useAppcontext();
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const modalRef = useRef(null);

	useEffect(() => {
		if (admin) {
			setName(admin.name || "");
			setEmail(admin.email || "");
			setPhone(admin.phone || "");
		}
	}, [admin]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				onClose();
			}
		};
		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	if (!isOpen || !admin) return null;

	const handleProfileUpdate = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const { data } = await axios.patch(`/auth/admins/${admin._id}`, {
				name,
				email,
				phone,
			});
			if (data.success) {
				onUpdate(data.data);
				toast.success("Admin details updated!");
				onClose();
			} else {
				toast.error(data.message || "Failed to update details.");
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		if (!newPassword) {
			toast.error("New password cannot be empty.");
			return;
		}
		setIsLoading(true);
		try {
			const { data } = await axios.patch(
				`/auth/admins/${admin._id}/password`,
				{ newPassword }
			);
			if (data.success) {
				toast.success(`Password for ${admin.name} has been updated!`);
				setNewPassword("");
				onClose();
			} else {
				toast.error(data.message || "Failed to update password.");
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemove = async () => {
		if (currentUser._id === admin._id) {
			toast.error("You cannot remove your own account.");
			return;
		}

		if (window.confirm(`Are you sure you want to remove ${admin.name}?`)) {
			setIsLoading(true);
			try {
				await axios.delete(`/auth/admins/${admin._id}`);
				onRemove(admin._id);
				toast.success(`${admin.name} has been removed.`);
				onClose();
			} catch (error) {
				toast.error(
					error.response?.data?.message || "An error occurred."
				);
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div
				ref={modalRef}
				className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-lg relative space-y-8"
			>
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
								className="w-full py-3 px-12 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
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
						className="w-full py-3 px-12 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
					>
						Remove Admin
					</button>
				</div>
			</div>
		</div>
	);
};

export default AdminEditModal;
