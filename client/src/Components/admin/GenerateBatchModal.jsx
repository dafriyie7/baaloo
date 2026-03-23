import { useEffect } from "react";
import { X } from "lucide-react";
import GenerateCodeForm from "./GenerateCodeForm";

const GenerateBatchModal = ({ isOpen, onClose, onGenerationSuccess }) => {
	useEffect(() => {
		if (!isOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[100] flex min-h-full items-start justify-center overflow-y-auto bg-stone-900/55 p-4 sm:p-6 sm:pt-10"
			role="presentation"
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="generate-batch-modal-title"
				className="relative my-auto w-full max-w-4xl rounded-md border border-amber-100/90 bg-white shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start justify-between gap-4 border-b border-amber-100 px-5 py-4 sm:px-6 sm:py-5">
					<div>
						<h2
							id="generate-batch-modal-title"
							className="text-xl font-bold text-stone-900"
						>
							Generate scratch batch
						</h2>
						<p className="mt-0.5 text-sm text-stone-600">
							Configure tiers, pool split, and optional symbols.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="shrink-0 rounded-md p-2 text-stone-500 transition-colors hover:bg-amber-50 hover:text-stone-800"
						aria-label="Close"
					>
						<X className="h-5 w-5" strokeWidth={2} />
					</button>
				</div>
				<div className="max-h-[min(78vh,56rem)] overflow-y-auto px-5 py-5 sm:px-6 sm:pb-6">
					<GenerateCodeForm
						embeddedInModal
						onGenerationSuccess={onGenerationSuccess}
					/>
				</div>
			</div>
		</div>
	);
};

export default GenerateBatchModal;
