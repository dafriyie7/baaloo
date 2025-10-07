import React from "react";

const CodeCard = ({ code }) => {
	return (
		<div
			key={code._id}
			className="p-4 bg-white rounded-2xl shadow-md text-center flex flex-col justify-between"
		>
			<img
				src={code.qrImage}
				alt={`QR Code for ${code.code}`}
				className="mx-auto mb-2 w-full h-auto"
			/>
			<div>
				<p className="font-mono text-base md:text-lg">{code.code}</p>
				<p className="text-xs text-gray-500">Batch: {code.batch}</p>
				<p
					className={`text-xs font-semibold ${
						code.redeemed ? "text-red-500" : "text-green-600"
					}`}
				>
					{code.redeemed ? "Redeemed" : "Available"}
				</p>
			</div>
		</div>
	);
};

export default CodeCard;
