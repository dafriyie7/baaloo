/**
 * Shared typography for primary admin screen titles.
 * Use {@link ADMIN_MAIN_TITLE_CLASS} on h2 when an h1 already exists (e.g. modal).
 */
export const ADMIN_MAIN_TITLE_CLASS =
	"text-3xl font-extrabold tracking-tight text-stone-950 sm:text-4xl sm:leading-[1.06] text-balance antialiased";

const alignClass = {
	start: "justify-center text-center sm:justify-start sm:text-left",
	center: "justify-center text-center",
};

/**
 * Bold, modern page title for admin routes. Optional leading icon.
 */
export default function AdminPageHeading({
	children,
	icon: Icon,
	align = "start",
	className = "",
}) {
	const a = alignClass[align] ?? alignClass.start;

	return (
		<h1
			className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${ADMIN_MAIN_TITLE_CLASS} ${a} ${className}`}
		>
			{Icon ? (
				<Icon
					className="h-8 w-8 shrink-0 text-amber-700 sm:h-9 sm:w-9"
					strokeWidth={2.25}
					aria-hidden
				/>
			) : null}
			{children}
		</h1>
	);
}
