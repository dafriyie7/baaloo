import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "../../../lib/api";
import { Images, LayoutGrid, List, Trash2, Upload } from "lucide-react";
import AdminPageHeading from "../../Components/admin/AdminPageHeading";
import SvgUploadModal from "../../Components/admin/SvgUploadModal";

const selectClass =
	"w-full min-w-[10rem] px-3 py-2 border border-amber-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-300 bg-white text-stone-900 text-sm";

const layoutToggleBtn =
	"inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50";

function staticOrigin() {
	const api = axios.defaults.baseURL || "";
	return api.replace(/\/api\/?$/i, "") || "";
}

const Svgs = () => {
	const [types, setTypes] = useState([]);
	const [filterType, setFilterType] = useState("");
	const [items, setItems] = useState([]);
	const [uploadModalOpen, setUploadModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [layout, setLayout] = useState(() => {
		try {
			const v = localStorage.getItem("adminSvgsLayout");
			return v === "grid" || v === "list" ? v : "list";
		} catch {
			return "list";
		}
	});

	const setLayoutPersist = useCallback((next) => {
		setLayout(next);
		try {
			localStorage.setItem("adminSvgsLayout", next);
		} catch {
			/* ignore */
		}
	}, []);

	const loadTypes = useCallback(async () => {
		try {
			const { data } = await axios.get("/svgs/types");
			if (data.success) {
				setTypes(data.data ?? []);
			}
		} catch {
			/* ignore */
		}
	}, []);

	const fetchSvgsList = useCallback(async (typeForRequest) => {
		setLoading(true);
		try {
			const { data } = await axios.get("/svgs", {
				params: typeForRequest ? { type: typeForRequest } : {},
			});
			if (data.success) {
				setItems(data.data ?? []);
			} else {
				toast.error(data.message || "Could not load SVGs.");
			}
		} catch (e) {
			toast.error(
				e.response?.data?.message || "Could not load SVGs."
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTypes();
	}, [loadTypes]);

	useEffect(() => {
		void fetchSvgsList(filterType);
	}, [filterType, fetchSvgsList]);

	const handleModalUploadSuccess = useCallback(
		async (type) => {
			await loadTypes();
			if (type === filterType) {
				await fetchSvgsList(type);
			}
			setFilterType(type);
		},
		[loadTypes, filterType, fetchSvgsList]
	);

	const deleteOne = async (id) => {
		if (!window.confirm("Delete this SVG?")) return;
		try {
			const { data } = await axios.delete(`/svgs/${id}`);
			if (data.success) {
				toast.success("Deleted.");
				loadTypes();
				void fetchSvgsList(filterType);
			} else {
				toast.error(data.message || "Delete failed.");
			}
		} catch (e) {
			toast.error(e.response?.data?.message || "Delete failed.");
		}
	};

	const deleteTheme = async () => {
		const t = filterType.trim().toLowerCase();
		if (!t) {
			toast.error("Pick a theme in the filter to delete the whole set.");
			return;
		}
		if (
			!window.confirm(
				`Delete ALL SVGs for theme “${t}”? This cannot be undone.`
			)
		) {
			return;
		}
		try {
			const { data } = await axios.delete("/svgs/by-type", {
				params: { type: t },
			});
			if (data.success) {
				toast.success(data.message || "Theme removed.");
				setFilterType("");
				loadTypes();
				void fetchSvgsList("");
			} else {
				toast.error(data.message || "Failed.");
			}
		} catch (e) {
			toast.error(e.response?.data?.message || "Failed.");
		}
	};

	const origin = staticOrigin();

	return (
		<div className="w-full p-4 sm:p-6 lg:p-8">
			<div className="mx-auto max-w-5xl">
				<div className="mb-8 text-center sm:text-left">
					<AdminPageHeading icon={Images}>SVGs</AdminPageHeading>
					<p className="mt-1 text-sm text-stone-600 sm:text-base">
						Upload SVGs in bulk per theme (<code className="text-xs">type</code>
						). File names become asset names (e.g.{" "}
						<code className="text-xs">A.svg</code> →{" "}
						<code className="text-xs">a</code>). Pick the same theme when
						generating a batch.
					</p>
				</div>

				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm text-stone-600">
						Add files in the uploader: preview, remove from queue, then
						upload.
					</p>
					<button
						type="button"
						onClick={() => setUploadModalOpen(true)}
						className="inline-flex items-center gap-2 rounded-md bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
					>
						<Upload className="h-4 w-4" strokeWidth={2} />
						Upload SVGs
					</button>
				</div>

				<SvgUploadModal
					isOpen={uploadModalOpen}
					onClose={() => setUploadModalOpen(false)}
					onUploadSuccess={handleModalUploadSuccess}
				/>

				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<label className="block min-w-[12rem] flex-1">
						<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
							Filter by theme
						</span>
						<select
							value={filterType}
							onChange={(e) => setFilterType(e.target.value)}
							className={selectClass}
						>
							<option value="">All themes</option>
							{types.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
					</label>
					<div className="flex flex-wrap items-center gap-2 sm:justify-end">
						<div
							className="inline-flex rounded-lg border border-amber-200/90 bg-stone-50/90 p-0.5 shadow-sm"
							role="group"
							aria-label="SVG layout"
						>
							<button
								type="button"
								aria-pressed={layout === "list"}
								onClick={() => setLayoutPersist("list")}
								className={`${layoutToggleBtn} ${
									layout === "list"
										? "bg-white text-amber-950 shadow-sm ring-1 ring-amber-100"
										: "text-stone-600 hover:bg-white/70 hover:text-stone-900"
								}`}
							>
								<List className="h-4 w-4" strokeWidth={2} aria-hidden />
								List
							</button>
							<button
								type="button"
								aria-pressed={layout === "grid"}
								onClick={() => setLayoutPersist("grid")}
								className={`${layoutToggleBtn} ${
									layout === "grid"
										? "bg-white text-amber-950 shadow-sm ring-1 ring-amber-100"
										: "text-stone-600 hover:bg-white/70 hover:text-stone-900"
								}`}
							>
								<LayoutGrid className="h-4 w-4" strokeWidth={2} aria-hidden />
								Grid
							</button>
						</div>
						{filterType ? (
							<button
								type="button"
								onClick={deleteTheme}
								className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 transition-colors hover:bg-rose-100"
							>
								<Trash2 className="h-4 w-4" strokeWidth={2} />
								Delete entire theme
							</button>
						) : null}
					</div>
				</div>

				<div className="overflow-hidden rounded-md border border-amber-100 bg-white shadow-sm">
					{loading ? (
						<p className="p-8 text-center text-sm text-stone-500">
							Loading…
						</p>
					) : items.length === 0 ? (
						<p className="p-8 text-center text-sm text-stone-500">
							No SVGs yet{filterType ? ` for “${filterType}”` : ""}.
						</p>
					) : layout === "list" ? (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[520px] text-left text-sm">
								<thead>
									<tr className="border-b border-amber-100 bg-stone-50/90 text-xs font-semibold uppercase tracking-wide text-stone-500">
										<th className="px-4 py-3">Preview</th>
										<th className="px-4 py-3">Theme</th>
										<th className="px-4 py-3">Name</th>
										<th className="px-4 py-3">File</th>
										<th className="px-4 py-3 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-100">
									{items.map((row) => (
										<tr
											key={row._id}
											className="text-stone-800 hover:bg-amber-50/30"
										>
											<td className="px-4 py-2">
												<img
													src={`${origin}${row.urlPath}`}
													alt=""
													className="h-10 w-10 object-contain"
												/>
											</td>
											<td className="px-4 py-2 font-mono text-xs">
												{row.type}
											</td>
											<td className="px-4 py-2 font-mono text-sm font-semibold">
												{row.name}
											</td>
											<td className="px-4 py-2 text-xs text-stone-500">
												{row.originalFileName || "—"}
											</td>
											<td className="px-4 py-2 text-right">
												<button
													type="button"
													onClick={() => deleteOne(row._id)}
													className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
												>
													<Trash2 className="h-3.5 w-3.5" />
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
							{items.map((row) => (
								<li
									key={row._id}
									className="flex flex-col rounded-lg border border-amber-100/90 bg-stone-50/40 p-3 shadow-sm transition-shadow hover:border-amber-200/90 hover:shadow-md"
								>
									<div className="mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-amber-100 bg-white p-2">
										<img
											src={`${origin}${row.urlPath}`}
											alt=""
											className="max-h-full max-w-full object-contain"
										/>
									</div>
									<p className="font-mono text-sm font-semibold text-stone-900">
										{row.name}
									</p>
									{!filterType ? (
										<p className="mt-0.5 font-mono text-[11px] text-stone-500">
											{row.type}
										</p>
									) : null}
									<p
										className="mt-1 line-clamp-2 text-xs text-stone-500"
										title={row.originalFileName || undefined}
									>
										{row.originalFileName || "—"}
									</p>
									<button
										type="button"
										onClick={() => deleteOne(row._id)}
										className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md border border-rose-200/80 bg-white py-2 text-xs font-semibold text-rose-800 transition-colors hover:bg-rose-50"
									>
										<Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
										Delete
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
};

export default Svgs;
