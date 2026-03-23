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
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 px-4 py-10">
			<div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-amber-200/35 p-8 rounded-2xl shadow-2xl shadow-stone-950/25">
				<p className="text-xs font-semibold uppercase tracking-widest text-amber-800 mb-1">
					Baaloo
				</p>
				<h1 className="text-3xl font-bold text-stone-900 mb-1">
					Admin sign in
				</h1>
				<p className="text-sm text-stone-500 mb-8">
					Use your admin email or phone and password.
				</p>
				<form
					onSubmit={handleLogin}
					className="w-full space-y-4 text-left"
				>
					<div>
						<label
							htmlFor="identifier"
							className="block text-sm font-medium text-stone-700 mb-1"
						>
							Email or phone
						</label>
						<input
							type="text"
							id="identifier"
							value={identifier}
							onChange={(e) => setIdentifier(e.target.value)}
							required
							placeholder="you@example.com"
							className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300"
						/>
					</div>
					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-stone-700 mb-1"
						>
							Password
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							placeholder="••••••••"
							className="block w-full px-4 py-3 bg-stone-50 border border-amber-100 text-stone-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300"
						/>
					</div>
					<div className="pt-4 w-full flex justify-center">
						<button
							type="submit"
							className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-amber-800 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-700 transition-colors"
						>
							Sign in
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
