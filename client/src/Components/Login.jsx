// GlassAuth.jsx
import { useState } from "react";

export default function GlassAuth() {
	const [activeTab, setActiveTab] = useState("login");

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-500 to-slate-900">
			<div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
				<h2 className="text-3xl font-bold text-white text-center mb-6">
					Welcome
				</h2>

				{/* Tabs */}
				<div className="flex justify-center mb-6">
					<button
						onClick={() => setActiveTab("login")}
						className={`px-4 py-2 font-semibold text-white border-b-2 transition-all ${
							activeTab === "login"
								? "border-white"
								: "border-white/0 hover:border-white"
						}`}
					>
						Login
					</button>
					<button
						onClick={() => setActiveTab("signup")}
						className={`px-4 py-2 font-semibold text-white border-b-2 transition-all ${
							activeTab === "signup"
								? "border-white"
								: "border-white/0 hover:border-white"
						}`}
					>
						Signup
					</button>
				</div>

				{/* Forms */}
				{activeTab === "login" && (
					<form className="space-y-4">
						<input
							type="email"
							placeholder="Email"
							className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
						/>
						<input
							type="password"
							placeholder="Password"
							className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
						/>
						<button className="w-full py-2 bg-white/30 text-white rounded-lg font-semibold hover:bg-white/50 transition">
							Login
						</button>
					</form>
				)}

				{activeTab === "signup" && (
					<form className="space-y-4">
						<input
							type="text"
							placeholder="Name"
							className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
						/>
						<input
							type="email"
							placeholder="Email"
							className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
						/>
						<input
							type="password"
							placeholder="Password"
							className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
						/>
						<button className="w-full py-2 bg-white/30 text-white rounded-lg font-semibold hover:bg-white/50 transition">
							Signup
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
