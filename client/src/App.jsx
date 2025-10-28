import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import Codes from "./Pages/admin/Codes";
import Scan from "./Pages/Scan";
import Layout from "./Components/Layout";
import { Toaster } from "react-hot-toast";

import Players from "./Pages/admin/Players";
import ClaimWin from "./Pages/ClaimWin";
import About from "./Pages/About";
import Loading from "./Components/Loading";
import { useAppcontext } from "./context/AppContext";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Profile from "./Pages/admin/Profile";
import Manage from "./Pages/admin/Manage";
import NotFound from "./Pages/NotFound";
import HowToPlay from "./Pages/HowToPlay";

const App = () => {
	const { isLoading, isLoggedIn, authChecked } = useAppcontext();

	if (!authChecked) {
		return <Loading />;
	}

	return (
		<div>
			<Toaster />
			{isLoading && <Loading />}
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />

				<Route path="/" element={<Layout />}>
					<Route index element={<Scan />} />
					<Route path="claim" element={<ClaimWin />} />
					<Route path="how-to-play" element={<HowToPlay />} />
					<Route path="scratch/:code" element={<Scan />} />
					<Route path="about" element={<About />} />
				</Route>
				
				<Route path="/admin" element={isLoggedIn ? <Layout /> : <Login />} >
					<Route index element={<Manage />} />
					<Route path="players" element={<Players />} />
					<Route path="codes" element={<Codes />} />
					<Route path="profile" element={<Profile />} />
				</Route>

				<Route path="*" element={<NotFound />} />
			</Routes>
		</div>
	);
};

export default App;
