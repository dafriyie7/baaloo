import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../lib/api";
import { useAppcontext } from "../context/AppContext";
import { ArrowLeft } from "lucide-react";

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
		<div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-zinc-50 px-4 py-12 relative overflow-hidden">
			{/* Ambient glows */}
			<div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/20 blur-[100px]" aria-hidden />
			<div className="absolute top-0 right-0 -z-10 h-[400px] w-[400px] translate-x-1/3 -translate-y-1/3 rounded-full bg-amber-200/40 blur-[80px]" aria-hidden />

			<div className="w-full max-w-md relative z-10 text-center">
				<div className="mb-8 flex justify-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-600 shadow-sm mb-4">
						Setup Operator
					</div>
				</div>

				<h1 className="text-[clamp(2rem,5vw,2.5rem)] font-black text-zinc-900 leading-tight mb-2">
					Register Admin
				</h1>
				<p className="text-base font-medium text-zinc-500 mb-8 max-w-sm mx-auto">
					Set up your operator account.
				</p>

				<form
					onSubmit={handleRegister}
					className="w-full space-y-4 text-left p-8 rounded-[2rem] border border-amber-200/40 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl"
				>
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-bold text-zinc-700 mb-1.5"
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
							className="block w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-4 text-zinc-900 shadow-inner outline-none ring-1 ring-zinc-200 transition-all focus:bg-white focus:ring-2 focus:ring-orange-500"
						/>
					</div>
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-bold text-zinc-700 mb-1.5"
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
							className="block w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-4 text-zinc-900 shadow-inner outline-none ring-1 ring-zinc-200 transition-all focus:bg-white focus:ring-2 focus:ring-orange-500"
						/>
					</div>
					<div>
						<label
							htmlFor="phone"
							className="block text-sm font-bold text-zinc-700 mb-1.5"
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
							className="block w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-4 text-zinc-900 shadow-inner outline-none ring-1 ring-zinc-200 transition-all focus:bg-white focus:ring-2 focus:ring-orange-500"
						/>
					</div>
					<div>
						<label
							htmlFor="password"
							className="block text-sm font-bold text-zinc-700 mb-1.5"
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
							className="block w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-4 text-zinc-900 shadow-inner outline-none ring-1 ring-zinc-200 transition-all focus:bg-white focus:ring-2 focus:ring-orange-500"
						/>
					</div>
					<div className="pt-4">
						<button
							type="submit"
							className="mt-2 w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/40 active:scale-[0.98]"
						>
							Register
						</button>
					</div>

					<div className="mt-4 text-center">
						<button
							type="button"
							onClick={() => navigate("/login")}
							className="text-sm font-bold text-zinc-500 hover:text-orange-600 transition-colors"
						>
							Already have an account? Sign in
						</button>
					</div>
				</form>

				<button
					type="button"
					onClick={() => navigate("/")}
					className="mt-8 mx-auto inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-zinc-600"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to public game
				</button>
			</div>
		</div>
	);
};

export default Register;
