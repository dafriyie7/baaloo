import { useCallback, useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import axios from "../../../lib/api";
import { Upload, X, Trash2, ImagePlus } from "lucide-react";

const inputClass =
	"w-full px-3 py-2 border border-amber-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-300 bg-white text-stone-900 text-sm placeholder:text-stone-400";

function apiBase() {
	return (axios.defaults.baseURL || "").replace(/\/$/, "");
}

/** Match server: stem → lowercase a–z0–9_ */
function derivedNameFromFile(file) {
	const base = file.name.replace(/\.svg$/i, "").trim();
	const n = base.toLowerCase().replace(/[^a-z0-9_]/g, "");
	return n || "?";
}

function isSvgFile(file) {
	const lower = file.name.toLowerCase();
	return (
		lower.endsWith(".svg") ||
		file.type === "image/svg+xml" ||
		file.type === "image/svg"
	);
}

function makeEntry(file) {
	return {
		id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
		file,
		previewUrl: URL.createObjectURL(file),
	};
}

const SvgUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
	const titleId = useId();
	const fileInputRef = useRef(null);
	const [themeType, setThemeType] = useState("");
	const [queue, setQueue] = useState([]);
	const [isUploading, setIsUploading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const revokeAll = useCallback((entries) => {
		for (const e of entries) {
			try {
				URL.revokeObjectURL(e.previewUrl);
			} catch {
				/* ignore */
			}
		}
	}, []);

	const resetAndClose = useCallback(() => {
		setQueue((prev) => {
			revokeAll(prev);
			return [];
		});
		setThemeType("");
		setIsUploading(false);
		setIsDragging(false);
		onClose();
	}, [onClose, revokeAll]);

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
			if (e.key === "Escape" && !isUploading) resetAndClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, isUploading, resetAndClose]);

	const addFiles = useCallback((fileList) => {
		const incoming = Array.from(fileList || []).filter(isSvgFile);
		const rejected = Array.from(fileList || []).length - incoming.length;
		if (rejected > 0) {
			toast.error(`${rejected} file(s) skipped (only .svg).`);
		}
		if (incoming.length === 0) return;
		setQueue((prev) => {
			const seen = new Set(
				prev.map((e) => `${e.file.name}-${e.file.size}-${e.file.lastModified}`)
			);
			const next = [...prev];
			for (const file of incoming) {
				const sig = `${file.name}-${file.size}-${file.lastModified}`;
				if (seen.has(sig)) continue;
				seen.add(sig);
				next.push(makeEntry(file));
			}
			return next;
		});
	}, []);

	const removeOne = useCallback((id) => {
		setQueue((prev) => {
			const entry = prev.find((e) => e.id === id);
			if (entry) {
				try {
					URL.revokeObjectURL(entry.previewUrl);
				} catch {
					/* ignore */
				}
			}
			return prev.filter((e) => e.id !== id);
		});
	}, []);

	const clearAll = useCallback(() => {
		setQueue((prev) => {
			revokeAll(prev);
			return [];
		});
	}, [revokeAll]);

	const handleUpload = async () => {
		const raw = themeType.trim();
		if (!raw) {
			toast.error(
				"Enter a theme name first — it groups these SVGs (e.g. fruit or holiday-2025)."
			);
			return;
		}
		const type = raw.toLowerCase();
		if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(type)) {
			toast.error(
				"That theme name isn’t valid. Use lowercase letters, numbers, and hyphens only, and start with a letter or number."
			);
			return;
		}
		if (queue.length === 0) {
			toast.error("Add at least one SVG to the queue.");
			return;
		}

		const fd = new FormData();
		for (const { file } of queue) {
			fd.append("files", file);
		}

		setIsUploading(true);
		const base = apiBase();
		try {
			const res = await fetch(
				`${base}/svgs/bulk?type=${encodeURIComponent(type)}`,
				{
					method: "POST",
					credentials: "include",
					body: fd,
				}
			);
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toast.error(data.message || "Upload failed.");
				return;
			}
			if (data.errors?.length) {
				for (const err of data.errors) {
					toast.error(`${err.file}: ${err.message}`);
				}
			}
			if (data.data?.length) {
				toast.success(`Uploaded ${data.data.length} SVG(s) for “${type}”.`);
			}
			onUploadSuccess?.(type);
			resetAndClose();
		} catch {
			toast.error("Upload failed.");
		} finally {
			setIsUploading(false);
		}
	};

	const onDrop = (e) => {
		e.preventDefault();
		setIsDragging(false);
		if (isUploading) return;
		addFiles(e.dataTransfer.files);
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[100] flex min-h-full items-start justify-center overflow-y-auto bg-stone-900/55 p-4 sm:p-6 sm:pt-10"
			role="presentation"
			onClick={() => !isUploading && resetAndClose()}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="relative my-auto w-full max-w-2xl rounded-lg border border-amber-100/90 bg-white shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start justify-between gap-4 border-b border-amber-100 px-5 py-4 sm:px-6 sm:py-5">
					<div>
						<h2
							id={titleId}
							className="text-xl font-bold text-stone-900"
						>
							Upload SVGs
						</h2>
						<p className="mt-0.5 text-sm text-stone-600">
							Choose a theme, add files, preview and remove any you don’t want,
							then upload.
						</p>
					</div>
					<button
						type="button"
						disabled={isUploading}
						onClick={resetAndClose}
						className="shrink-0 rounded-md p-2 text-stone-500 transition-colors hover:bg-amber-50 hover:text-stone-800 disabled:opacity-40"
						aria-label="Close"
					>
						<X className="h-5 w-5" strokeWidth={2} />
					</button>
				</div>

				<div className="max-h-[min(72vh,40rem)] space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:pb-6">
					<label className="block">
						<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
							Theme type
						</span>
						<input
							type="text"
							value={themeType}
							onChange={(e) => setThemeType(e.target.value)}
							disabled={isUploading}
							placeholder="e.g. fruit, holiday-2025"
							className={inputClass}
						/>
					</label>

					<input
						ref={fileInputRef}
						type="file"
						accept=".svg,image/svg+xml"
						multiple
						className="sr-only"
						disabled={isUploading}
						onChange={(e) => {
							addFiles(e.target.files);
							e.target.value = "";
						}}
					/>

					<div
						onDragEnter={(e) => {
							e.preventDefault();
							setIsDragging(true);
						}}
						onDragOver={(e) => {
							e.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={(e) => {
							e.preventDefault();
							if (!e.currentTarget.contains(e.relatedTarget)) {
								setIsDragging(false);
							}
						}}
						onDrop={onDrop}
						className={`rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
							isDragging
								? "border-amber-500 bg-amber-50/80"
								: "border-amber-200 bg-stone-50/60 hover:border-amber-300"
						} ${isUploading ? "pointer-events-none opacity-50" : ""}`}
					>
						<ImagePlus className="mx-auto h-10 w-10 text-amber-700/80" strokeWidth={1.5} />
						<p className="mt-2 text-sm font-medium text-stone-700">
							Drag SVGs here or{" "}
							<button
								type="button"
								disabled={isUploading}
								onClick={() => fileInputRef.current?.click()}
								className="font-semibold text-amber-900 underline-offset-2 hover:underline"
							>
								browse
							</button>
						</p>
						<p className="mt-1 text-xs text-stone-500">
							Only <code className="text-[11px]">.svg</code> — 							name becomes asset
							name (e.g. <code className="text-[11px]">A.svg</code> →{" "}
							<code className="text-[11px]">a</code>).
						</p>
					</div>

					{queue.length > 0 ? (
						<div>
							<div className="mb-2 flex items-center justify-between gap-2">
								<span className="text-sm font-semibold text-stone-800">
									Queue ({queue.length})
								</span>
								<button
									type="button"
									disabled={isUploading}
									onClick={clearAll}
									className="text-xs font-semibold text-rose-700 hover:underline disabled:opacity-40"
								>
									Remove all
								</button>
							</div>
							<ul className="space-y-2 rounded-md border border-amber-100/80 bg-stone-50/50 p-2">
								{queue.map((entry) => (
									<li
										key={entry.id}
										className="flex items-center gap-3 rounded-md border border-amber-100/60 bg-white p-2 pr-2 shadow-sm"
									>
										<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-amber-100 bg-white">
											<img
												src={entry.previewUrl}
												alt=""
												className="max-h-full max-w-full object-contain"
											/>
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-stone-900">
												{entry.file.name}
											</p>
											<p className="text-xs text-stone-500">
												Asset name:{" "}
												<span className="font-mono font-semibold text-stone-700">
													{derivedNameFromFile(entry.file)}
												</span>
											</p>
										</div>
										<button
											type="button"
											disabled={isUploading}
											onClick={() => removeOne(entry.id)}
											className="shrink-0 rounded-md p-2 text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
											aria-label={`Remove ${entry.file.name}`}
										>
											<Trash2 className="h-4 w-4" strokeWidth={2} />
										</button>
									</li>
								))}
							</ul>
						</div>
					) : (
						<p className="text-center text-sm text-stone-500">
							No files in queue yet.
						</p>
					)}
				</div>

				<div className="flex flex-wrap items-center justify-end gap-2 border-t border-amber-100 px-5 py-4 sm:px-6">
					<button
						type="button"
						disabled={isUploading}
						onClick={resetAndClose}
						className="rounded-md border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-amber-50 disabled:opacity-40"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={isUploading || queue.length === 0}
						onClick={handleUpload}
						className="inline-flex items-center gap-2 rounded-md bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-45"
					>
						<Upload className="h-4 w-4" strokeWidth={2} />
						{isUploading
							? "Uploading…"
							: queue.length > 0
								? `Upload ${queue.length} SVG${queue.length === 1 ? "" : "s"}`
								: "Upload"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default SvgUploadModal;
