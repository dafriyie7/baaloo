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
		// Use player details from the verified redemption response
		const phone = winner?.player?.phone || winner?.phone;
		const ticket = winner?.scratchCode || winner?.code?.plainCode || winner?.code?.code;

		if (!phone) {
			toast.error("Missing phone number. Please scan your ticket again.");
			return;
		}

		if (!ticket) {
			toast.error("Missing ticket code. Please scan your ticket again.");
			return;
		}

		setClaiming(true);
		try {
			const { data } = await axiosInstance.post("/players/claim-win", {
				phone: String(phone),
				ticket: String(ticket),
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
