import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAppcontext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Won from "../Components/Won";
import axiosInstance from "../../lib/api";

const ClaimWin = () => {
	const { winner } = useAppcontext();
	const navigate = useNavigate();
	const [claiming, setClaiming] = useState(false);

	const onClaim = async () => {
		if (!winner?.phone) {
			toast.error("Missing player details. Please register your ticket again.");
			return;
		}

		const ticket =
			winner.code?.plainCode ??
			(winner.code?.code && typeof winner.code.code === "string"
				? winner.code.code
				: null);

		if (!ticket) {
			toast.error(
				"We could not read your ticket code. Open this page from the same device you used to play, or scan again."
			);
			return;
		}

		setClaiming(true);
		try {
			const { data } = await axiosInstance.post("/players/claim-win", {
				phone: String(winner.phone),
				ticket,
			});

			if (data.success) {
				toast.success(data.message || "Payout started.");
			} else {
				toast.error(data.message || "Could not start payout.");
			}
		} catch (error) {
			const msg =
				error.response?.data?.message ||
				error.message ||
				"Could not start payout.";
			toast.error(msg);
		} finally {
			setClaiming(false);
		}
	};

	return (
		<Won
			winner={winner}
			onClaim={onClaim}
			claimDisabled={claiming}
			onHome={() => navigate("/")}
		/>
	);
};

export default ClaimWin;
