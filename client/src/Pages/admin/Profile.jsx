import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "../../../lib/api";
import { UserCircle, LogOut } from "lucide-react";
import { useAppcontext } from "../../context/AppContext";
import AdminHeader from "../../Components/admin/AdminHeader";

const Profile = () => {
	const { user, setIsLoading, login } = useAppcontext();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");

	useEffect(() => {
		if (user) {
			setName(user.name || "");
			setPhone(user.phone || "");
		}
	}, [user]);

	const handleProfileUpdate = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const { data } = await axios.patch("/auth/update-user", {
				name,
				phone,
			});
			if (data.success) {
				toast.success("Profile updated successfully!");
				login(data.data);
			} else {
				toast.error(data.message || "Failed to update profile.");
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		if (!oldPassword || !newPassword) {
			toast.error("Both password fields are required.");
			return;
		}
		setIsLoading(true);
		try {
			const { data } = await axios.patch("/auth/update-password", {
				oldPassword,
				newPassword,
			});
			if (data.success) {
				toast.success("Password changed successfully!");
				setOldPassword("");
				setNewPassword("");
			} else {
				toast.error(data.message || "Failed to change password.");
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full flex flex-col px-4 py-8 sm:py-12 max-w-7xl mx-auto">
			<AdminHeader 
				title="Your Profile"
				subtitle="Name and phone shown in the admin area."
				icon={UserCircle}
				actions={[
					{ label: "Logout", icon: LogOut, onClick: () => { localStorage.removeItem("token"); window.location.href = "/login"; } }
				]}
			/>

			<div className="w-full max-w-md bg-white p-8 rounded-md border border-amber-100/90 shadow-sm space-y-10 mx-auto">
				<div>
					<h2 className="text-xl font-bold text-stone-900 mb-1 text-center">Update Details</h2>
					<p className="text-sm text-stone-500 text-center mb-6">
						Manage your administrative identity.
					</p>
					<form
						onSubmit={handleProfileUpdate}
						className="w-full space-y-4 text-left"
					>
						<div>
							<label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">Name</label>
							<input
								type="text"
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
							/>
						</div>
						<div>
							<label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
							<input
								type="text"
								id="phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
							/>
						</div>
						<div className="pt-2">
							<button
								type="submit"
								className="w-full py-3 px-6 rounded-md text-sm font-semibold text-white bg-amber-800 hover:bg-amber-700 transition-colors"
							>
								Save changes
							</button>
						</div>
					</form>
				</div>

				<div className="border-t border-amber-100 pt-10">
					<h2 className="text-xl font-bold text-stone-900 mb-1 text-center">Change password</h2>
					<p className="text-sm text-stone-500 text-center mb-6">
						Keep your account secure with a strong password.
					</p>
					<form
						onSubmit={handlePasswordChange}
						className="w-full space-y-4 text-left"
					>
						<input
							type="password"
							id="oldPassword"
							value={oldPassword}
							onChange={(e) => setOldPassword(e.target.value)}
							placeholder="Current password"
							required
							className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
						/>
						<input
							type="password"
							id="newPassword"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="New password"
							required
							className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300"
						/>
						<div className="pt-2">
							<button
								type="submit"
								className="w-full py-3 px-6 rounded-md text-sm font-semibold text-white bg-stone-800 hover:bg-stone-700 transition-colors"
							>
								Update password
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Profile;
