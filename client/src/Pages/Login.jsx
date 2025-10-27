import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../lib/api";
import { useAppcontext } from "../context/AppContext";

const Login = () => {
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const { setIsLoading, setIsLoggedIn, setUser } = useAppcontext();
	const navigate = useNavigate();

	const handleLogin = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const { data } = await axios.post("/auth/login", {
				identifier,
				password,
			});

			if (data.success) {
				toast.success("Login successful!");
				sessionStorage.setItem("user", JSON.stringify(data.user));
				setUser(data.user);
				setIsLoggedIn(true)
				navigate("/admin/codes");
			} else {
				toast.error(data.message || "Login failed.");
			}
		} catch (error) {
			toast.error(
				error.response?.data?.message ||
					"An error occurred during login."
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
			<div className="w-full max-w-md bg-slate-200/10 backdrop-blur-lg border border-slate-400/20 p-8 rounded-2xl shadow-2xl">
				<h1 className="text-3xl font-bold text-slate-200 mb-6">
					Admin Login
				</h1>
				<form
					onSubmit={handleLogin}
					className="w-full space-y-4 text-left"
				>
					<div>
						<label
							htmlFor="identifier"
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Email or Phone
						</label>
						<input
							type="text"
							id="identifier"
							value={identifier}
							onChange={(e) => setIdentifier(e.target.value)}
							required
							placeholder="Enter your email or phone"
							className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-500 text-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-slate-400 focus:border-slate-400"
						/>
					</div>
					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Password
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							placeholder="Enter your account password"
							className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-500 text-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-slate-400 focus:border-slate-400"
						/>
					</div>
					<div className="pt-4 w-full flex justify-center">
						<button
							type="submit"
							className="w-full py-3 px-12 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105"
						>
							Login
						</button>
					</div>
					{/* <p
						onClick={() => navigate("/register")}
						className="flex justify-end text-slate-200 cursor-pointer hover:scale-101 duration-100"
					>
						Don't have an account?
					</p> */}
				</form>
			</div>
		</div>
	);
};

export default Login;
