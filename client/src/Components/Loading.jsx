import React from "react";

const Loading = () => {
	return (
		<div className="h-screen w-full flex items-center justify-center">
			<div className="relative h-2 w-40 overflow-hidden rounded bg-gray-200">
				<div className="absolute inset-0 w-1/2 animate-shimmer bg-slate-800" />
			</div>
		</div>
	);
};

export default Loading;
