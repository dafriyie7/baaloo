const StatCard = ({ icon, label, value, color }) => (
	<div className="bg-white py-4 px-2 rounded-2xl shadow-lg flex items-center gap-4">
		<div className={`p-3 rounded-full ${color}`}>{icon}</div>
		<div>
			<p className="text-2xl font-bold text-gray-800">{value}</p>
			<p className="text-sm text-gray-500">{label}</p>
		</div>
	</div>
);

export default StatCard;
