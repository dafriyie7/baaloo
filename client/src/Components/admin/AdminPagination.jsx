import React from 'react';
import { ChevronsLeft, ChevronsRight } from "lucide-react";

const AdminPagination = ({ currentPage, totalPages, setCurrentPage }) => {
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/50 px-6 py-4">
			<p className="text-xs font-medium text-stone-500">
				Page <span className="font-bold text-stone-900">{currentPage}</span> of <span className="font-bold text-stone-900">{totalPages}</span>
			</p>
			<div className="flex items-center gap-2">
				<button
					onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
					disabled={currentPage === 1}
					className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 shadow-sm transition-all hover:bg-stone-50 disabled:opacity-30"
				>
					<ChevronsLeft size={16} />
				</button>
				<div className="flex items-center gap-1">
					{[...Array(Math.min(5, totalPages))].map((_, i) => {
						let pageNum;
						if (totalPages <= 5) pageNum = i + 1;
						else if (currentPage <= 3) pageNum = i + 1;
						else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
						else pageNum = currentPage - 2 + i;

						return (
							<button
								key={pageNum}
								onClick={() => setCurrentPage(pageNum)}
								className={`h-8 min-w-[32px] rounded-md border text-xs font-black transition-all ${
									currentPage === pageNum
										? "border-amber-200 bg-amber-100 text-amber-900 shadow-sm"
										: "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
								}`}
							>
								{pageNum}
							</button>
						);
					})}
				</div>
				<button
					onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
					disabled={currentPage === totalPages}
					className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 shadow-sm transition-all hover:bg-stone-50 disabled:opacity-30"
				>
					<ChevronsRight size={16} />
				</button>
			</div>
		</div>
	);
};

export default AdminPagination;
