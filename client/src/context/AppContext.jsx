import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/api";
import { useLocation, useNavigate } from "react-router-dom";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
	const [winner, setWinner] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [authChecked, setAuthChecked] = useState(true);
	const [user, setUser] = useState(null);
	const [systemSettings, setSystemSettings] = useState({
		payoutsEnabled: true,
		maintenanceMode: false,
		allowNewRedemptions: true
	});
	const navigate = useNavigate()
	const location = window.location.pathname;

	const currency = "GH₵";

	const getUser = async () => {
		setAuthChecked(false)
		try {
			const user = sessionStorage.getItem("user");
			if (user) {
				setUser(JSON.parse(user));
				setIsLoggedIn(true);
			} else {
				const { data } = await axiosInstance.get("/auth/check-auth")
				if (data.success) {
					setUser(data.data);
					setIsLoggedIn(true);
				} else {
					setUser(null);
					setIsLoggedIn(false);
				}
			}
		} catch (error) {
			console.log(error);
			toast.error(
				error?.response?.data?.message ||
					error?.message ||
					"something went wrong"
			);
		} finally {
			setAuthChecked(true);
		}
	};

	const getStoredWinner = () => {
		try {
			const storedWinner = sessionStorage.getItem("winner");
			if (storedWinner) {
				setWinner(JSON.parse(storedWinner));
			}
		} catch (error) {
			console.log(error);
		}
	};
	const getSystemSettings = async () => {
		try {
			const { data } = await axiosInstance.get("/system/settings");
			if (data.success) {
				setSystemSettings(data.settings);
			}
		} catch (error) {
			console.log("Failed to fetch system settings", error);
		}
	};

	useEffect(() => {
		if (location.includes("admin")) {
			getUser()
		}
		getStoredWinner();
		getSystemSettings();
	}, []);

	const logout = async () => {
		try {
			const { data } = await axiosInstance.post("/auth/logout");
			if (data.success) {
				sessionStorage.removeItem("user");
				setUser(null);
				setIsLoggedIn(false);
			} else {
				toast.error(data.message || "something went wrong");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const value = {
		winner,
		setWinner,
		isLoading,
		setIsLoading,
		currency,
		isLoggedIn,
		setIsLoggedIn,
		authChecked,
		user,
		setUser,
		logout,
		navigate,
		systemSettings,
		setSystemSettings,
		getSystemSettings
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppcontext = () => {
	return useContext(AppContext);
};
