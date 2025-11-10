

const CodeCard = ({ code }) => {
	return (
		<div
			key={code._id}
			className="p-4 text-center flex flex-col justify-between bg-white"
		>
			<img
				src={code.qrImage}
				alt={`QR Code for ${code.code}`}
				className="mx-auto mb-2 w-full h-auto"
			/>
			<div className="">
				<p className="font-mono text-base md:text-lg">{code.code}</p>
				<p className="font-mono text-base md:text-lg">"{ code.patternMatch }"</p>
				<p
					className={`text-xs font-semibold ${
						code.isUsed ? "text-red-500" : "text-green-600"
					}`}
				>
					{code.isUsed ? "Redeemed" : "Available"}
				</p>
			</div>
		</div>
	);
};

export default CodeCard;
