import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "../../lib/api";
import { useAppcontext } from "../context/AppContext";

const Profile = () => {
	const { user, setIsLoading, login } = useAppcontext();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");

	console.log(user)

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
				// Update user in context and local storage
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
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-8">
			<div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg space-y-8">
				{/* Update Profile Section */}
				<div>
					<h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
						Update Profile
					</h1>
					<form
						onSubmit={handleProfileUpdate}
						className="w-full space-y-4 text-left"
					>
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Name
							</label>
							<input
								type="text"
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
							/>
						</div>
						<div>
							<label
								htmlFor="phone"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Phone
							</label>
							<input
								type="text"
								id="phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
							/>
						</div>
						<div className="pt-2 w-full flex justify-center">
							<button
								type="submit"
								className="w-full py-3 px-12 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
							>
								Save Changes
							</button>
						</div>
					</form>
				</div>

				{/* Change Password Section */}
				<div>
					<h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
						Change Password
					</h1>
					<form
						onSubmit={handlePasswordChange}
						className="w-full space-y-4 text-left"
					>
						<input
							type="password"
							id="oldPassword"
							value={oldPassword}
							onChange={(e) => setOldPassword(e.target.value)}
							placeholder="Old Password"
							required
							className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-full shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
						/>
						<input
							type="password"
							id="newPassword"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="New Password"
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
			</div>
		</div>
	);
};

export default Profile;
