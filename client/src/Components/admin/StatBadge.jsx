import React from 'react';

const StatBadge = ({ label, value, color = "border-stone-100 bg-white", labelColor = "text-stone-400", valueColor = "text-stone-900", className = "" }) => (
	<div className={`flex items-center gap-2 rounded-md border px-4 py-2 shadow-sm transition-all ${color} ${className}`}>
		<span className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>{label}:</span>
		<span className={`text-sm font-black ${valueColor}`}>{value}</span>
	</div>
);

export default StatBadge;
