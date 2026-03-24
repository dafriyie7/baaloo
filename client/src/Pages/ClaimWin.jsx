import React from "react";
import { useAppcontext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Won from "../Components/Won";

const ClaimWin = () => {
	const { winner } = useAppcontext();
	const navigate = useNavigate();

	return <Won winner={winner} onHome={() => navigate("/")} />;
};

export default ClaimWin;
