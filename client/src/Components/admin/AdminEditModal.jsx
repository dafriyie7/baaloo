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
		<div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div
				ref={modalRef}
				className="bg-white w-full max-w-lg p-8 rounded-md border border-amber-100 shadow-xl relative space-y-8"
			>
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-amber-50 transition-colors"
					aria-label="Close"
				>
					<X size={22} />
				</button>

				<div>
					<h2 className="text-2xl font-bold text-stone-900 mb-1 text-center pr-8">
						{admin.name}
					</h2>
					<p className="text-sm text-stone-500 text-center mb-6">
						Edit account details or reset password.
					</p>
					<form
						onSubmit={handleProfileUpdate}
						className="w-full space-y-4 text-left"
					>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Full name"
							className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
						/>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email address"
							className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
						/>
						<input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="Phone number"
							className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
						/>
						<div className="pt-2 w-full flex justify-center">
							<button
								type="submit"
								className="w-full py-3 px-6 rounded-md text-sm font-semibold text-white bg-amber-800 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-700 transition-colors"
							>
								Save details
							</button>
						</div>
					</form>
				</div>

				<div className="border-t border-amber-100 pt-8">
					<h3 className="text-lg font-bold text-stone-900 mb-4 text-center">
						Reset password
					</h3>
					<form
						onSubmit={handlePasswordChange}
						className="w-full space-y-4 text-left"
					>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="New password"
							required
							className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
						/>
						<div className="pt-2 w-full flex justify-center">
							<button
								type="submit"
								className="w-full py-3 px-6 rounded-md text-sm font-semibold text-white bg-stone-800 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors"
							>
								Update password
							</button>
						</div>
					</form>
				</div>

				<div className="border-t border-amber-100 pt-6">
					<button
						type="button"
						onClick={handleRemove}
						className="w-full py-3 px-6 rounded-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
					>
						Remove admin
					</button>
				</div>
			</div>
		</div>
	);
};

export default AdminEditModal;
