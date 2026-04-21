import React, { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import AdminPageHeading from "./AdminPageHeading";

/**
 * Unified Admin Header & Controls Component
 * Matches the 'Codes' page design precisely with expanding search.
 */
const AdminHeader = ({
	title,
	subtitle,
	icon: Icon,
	actions = [], // [{ label, onClick, icon: BtnIcon, variant: 'primary'|'dark' }]
	search,
	setSearch,
	searchPlaceholder = "Search...",
	filters = [], // [{ label, value, onChange, options: [{ value, label }] }]
	onClear,
	showClear,
}) => {
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const selectClass =
		"w-full min-w-[10rem] px-3 py-2 border border-amber-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-300 bg-white text-stone-900 text-sm transition-all";

	return (
		<div className="mb-10">
			{/* Header Row */}
			<div className="mb-8 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
				<div>
					<AdminPageHeading icon={Icon}>{title}</AdminPageHeading>
					{subtitle && (
						<p className="mt-1 text-sm font-medium text-stone-500">
							{subtitle}
						</p>
					)}
				</div>

				<div className="flex flex-wrap items-center justify-center gap-3">
					{/* Expanding Search - Only show if setSearch is provided */}
					{setSearch && (
						<div className="flex items-center gap-2">
							{isSearchOpen ? (
								<div className="relative flex items-center animate-in slide-in-from-right-2 duration-300">
									<input
										type="text"
										value={search}
										autoFocus
										onChange={(e) => setSearch(e.target.value)}
										placeholder={searchPlaceholder}
										className="w-48 sm:w-64 rounded-md border border-amber-200 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-amber-400/20"
									/>
									<button
										onClick={() => {
											setIsSearchOpen(false);
											if (search) setSearch("");
										}}
										className="absolute right-2 text-stone-400 hover:text-stone-600"
									>
										<X size={16} />
									</button>
								</div>
							) : (
								<button
									onClick={() => setIsSearchOpen(true)}
									className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-100 bg-white text-stone-500 shadow-sm transition-all hover:bg-amber-50"
									title="Open Search"
								>
									<Search size={18} />
								</button>
							)}
						</div>
					)}

					{/* Action Buttons */}
					{actions.map((btn, idx) => (
						<button
							key={idx}
							onClick={btn.onClick}
							className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${
								btn.variant === "dark"
									? "bg-amber-800 text-white border-amber-900 hover:bg-amber-700 shadow-lg shadow-amber-900/10"
									: "bg-white text-stone-600 border-amber-200/60 hover:bg-amber-50 hover:text-amber-900"
							}`}
						>
							{btn.icon && <btn.icon className="h-4 w-4" />}
							{btn.label}
						</button>
					))}
				</div>
			</div>

			{/* Filter Controls Block */}
			<div className="flex flex-wrap items-end gap-4">
				{filters.map((f, idx) => (
					<div key={idx} className="min-w-[160px]">
						<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400 sm:text-left">
							{f.label}
						</label>
						<select
							value={f.value}
							onChange={(e) => f.onChange(e.target.value)}
							className={selectClass}
						>
							<option key="all" value="all">All {f.label}s</option>
							{f.options.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
				))}

				{showClear && (
					<div className="pb-1">
						<button
							onClick={onClear}
							className="text-xs font-black uppercase tracking-widest text-amber-800 transition-colors hover:text-amber-900"
						>
							Clear Filters
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminHeader;
