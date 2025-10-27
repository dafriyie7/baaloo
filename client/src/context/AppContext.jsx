import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/api";
import { useNavigate } from "react-router-dom";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
	const [winner, setWinner] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const [user, setUser] = useState(null);
	const navigate = useNavigate()

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

	useEffect(() => {
		getUser();
		getStoredWinner();
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
		navigate
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppcontext = () => {
	return useContext(AppContext);
};
