const StatCard = ({
	icon,
	label,
	value,
	color = "bg-amber-50 text-amber-700",
	handleClick,
	className = "",
}) => (
	<div
		onClick={handleClick}
		onKeyDown={(e) => {
			if (handleClick && (e.key === "Enter" || e.key === " ")) {
				e.preventDefault();
				handleClick();
			}
		}}
		role={handleClick ? "button" : undefined}
		tabIndex={handleClick ? 0 : undefined}
		className={`bg-white py-4 px-4 rounded-md border border-amber-100/90 shadow-sm flex items-center gap-4 transition-all duration-200 ${className} ${
			handleClick
				? "cursor-pointer hover:border-amber-200 hover:shadow-md active:scale-[0.99]"
				: ""
		}`}
	>
		<div
			className={`p-3 rounded-md shrink-0 [&>svg]:w-6 [&>svg]:h-6 ${color}`}
		>
			{icon}
		</div>
		<div className="min-w-0 text-left">
			<p className="text-2xl font-bold text-stone-900 tabular-nums tracking-tight">
				{value}
			</p>
			<p className="text-sm text-stone-500 font-medium mt-0.5">{label}</p>
		</div>
	</div>
);

export default StatCard;
