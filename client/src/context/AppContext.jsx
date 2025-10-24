import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/api";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
	const [winner, setWinner] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [authChecked, setAuthChecked] = useState(false); // New state to track initial auth check
	const [user, setUser] = useState(null);

	const currency = "GH₵";

	const getUser = async () => {
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
			toast.error(error.response.data.message || "something went wrong");
		} finally {
			setAuthChecked(true); // Mark auth check as complete
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
			// Don't show a toast on initial load errors
		}
	};

	useEffect(() => {
		getUser();
		getStoredWinner();
	}, []);

	const login = (userData) => {
		sessionStorage.setItem("user", JSON.stringify(userData));
		setUser(userData);
		setIsLoggedIn(true);
	};

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
		authChecked, // Expose the new state
		user,
		setUser,
		login,
		logout,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppcontext = () => {
	return useContext(AppContext);
};
