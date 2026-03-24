import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";

const inputClass =
	"w-full px-3 py-2 border border-amber-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-300 bg-white text-stone-900 text-sm font-mono placeholder:text-stone-400";

/**
 * Destructive confirmation: user must type `requiredExactText` exactly before delete runs.
 * `onDelete` should return true to close the modal, false to keep it open (e.g. after API error).
 */
const ConfirmDeleteByNameModal = ({
	isOpen,
	onClose,
	title,
	description,
	requiredExactText,
	fieldLabel = "Confirmation",
	confirmButtonLabel = "Delete",
	onDelete,
}) => {
	const titleId = useId();
	const inputId = useId();
	const [value, setValue] = useState("");
	const [busy, setBusy] = useState(false);

	const required = String(requiredExactText ?? "").trim();
	const matches = value.trim() === required && required.length > 0;

	useEffect(() => {
		if (isOpen) {
			setValue("");
			setBusy(false);
		}
	}, [isOpen, requiredExactText]);

	useEffect(() => {
		if (!isOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen || busy) return;
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, busy, onClose]);

	const handleDelete = async () => {
		if (!matches || busy) return;
		setBusy(true);
		try {
			const ok = await onDelete();
			if (ok !== false) {
				setValue("");
				onClose();
			}
		} catch {
			/* Parent should toast; keep modal open */
		} finally {
			setBusy(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[100] flex min-h-full items-start justify-center overflow-y-auto bg-stone-900/55 p-4 sm:p-6 sm:pt-10"
			role="presentation"
			onClick={() => !busy && onClose()}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="relative my-auto w-full max-w-md rounded-lg border border-amber-100/90 bg-white shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start justify-between gap-4 border-b border-amber-100 px-5 py-4 sm:px-6">
					<h2
						id={titleId}
						className="text-lg font-bold text-stone-900"
					>
						{title}
					</h2>
					<button
						type="button"
						disabled={busy}
						onClick={onClose}
						className="shrink-0 rounded-md p-2 text-stone-500 transition-colors hover:bg-amber-50 hover:text-stone-800 disabled:opacity-40"
						aria-label="Close"
					>
						<X className="h-5 w-5" strokeWidth={2} />
					</button>
				</div>

				<div className="space-y-4 px-5 py-5 sm:px-6 sm:pb-6">
					<div className="text-sm text-stone-600">{description}</div>
					<div>
						<label
							htmlFor={inputId}
							className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500"
						>
							{fieldLabel}
						</label>
						<input
							id={inputId}
							type="text"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							disabled={busy}
							autoComplete="off"
							spellCheck={false}
							className={inputClass}
						/>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-end gap-2 border-t border-amber-100 px-5 py-4 sm:px-6">
					<button
						type="button"
						disabled={busy}
						onClick={onClose}
						className="rounded-md border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-amber-50 disabled:opacity-40"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={!matches || busy}
						onClick={handleDelete}
						className="rounded-md bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-45"
					>
						{busy ? "Deleting…" : confirmButtonLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmDeleteByNameModal;
