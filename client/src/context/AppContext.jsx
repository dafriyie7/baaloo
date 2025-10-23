import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
	const [winner, setWinner] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [authChecked, setAuthChecked] = useState(false); // New state to track initial auth check
	const [user, setUser] = useState(null);

	const currency = "GH₵";

	const getUser = () => {
		try {
			const user = localStorage.getItem("user");
			if (user) {
				setUser(JSON.parse(user));
				setIsLoggedIn(true);
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
			const storedWinner = localStorage.getItem("winner");
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
		localStorage.setItem("user", JSON.stringify(userData));
		setUser(userData);
		setIsLoggedIn(true);
	};

	const logout = () => {
		localStorage.removeItem("user");
		setUser(null);
		setIsLoggedIn(false);
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
