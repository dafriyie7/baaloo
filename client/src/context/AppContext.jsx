import { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
	const [winner, setWinner] = useState({});
	const [isLoading, setIsLoading] = useState(false);

	const currency = "GH₵";

	useEffect(() => {
		try {
			const storedWinner = localStorage.getItem("winner");
			if (storedWinner) {
				setWinner(JSON.parse(storedWinner));
			}
		} catch (error) {
			console.log(error);
		}
	}, []);
	const value = { winner, setWinner, isLoading, setIsLoading, currency };

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppcontext = () => {
	return useContext(AppContext);
};
