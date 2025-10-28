import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../lib/api";
import { useAppcontext } from "../context/AppContext";

const Register = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("password");
	const { setIsLoading } = useAppcontext();
	const navigate = useNavigate();

	const handleRegister = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const { data } = await axios.post("/auth/register", {
				name,
				email,
				phone,
				password,
			});

			if (data.success) {
				toast.success("Registration successful! Please log in.");
				navigate("/login");
			} else {
				toast.error(data.message || "Registration failed.");
			}
		} catch (error) {
			toast.error(
				error.response?.data?.message ||
					"An error occurred during registration."
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
			<div className="w-full max-w-md bg-slate-200/10 backdrop-blur-lg border border-slate-400/20 p-8 rounded-2xl text-center shadow-2xl">
				<h1 className="text-3xl font-bold text-slate-200 mb-6">
					Admin Registration
				</h1>
				<form
					onSubmit={handleRegister}
					className="w-full space-y-4 text-left"
				>
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Full Name
						</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							placeholder="Enter your full name"
							className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-500 text-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-slate-400 focus:border-slate-400"
						/>
					</div>
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Email
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="Enter your email"
							className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-500 text-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-slate-400 focus:border-slate-400"
						/>
					</div>
					<div>
						<label
							htmlFor="phone"
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Phone
						</label>
						<input
							type="tel"
							id="phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							required
							placeholder="Enter your phone number"
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
							placeholder="Enter your password"
							className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-500 text-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-slate-400 focus:border-slate-400"
						/>
					</div>
					<div className="pt-4 w-full flex justify-center">
						<button
							type="submit"
							className="w-full py-3 px-12 border border-transparent rounded-full shadow-sm text-md font-medium text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-transform duration-300 hover:scale-105"
						>
							Register
						</button>
					</div>
					<p onClick={() => navigate("/login")} className="flex justify-end text-slate-200 cursor-pointer hover:scale-101 duration-100">
						Already have an account?
					</p>
				</form>
			</div>
		</div>
	);
};

export default Register;
