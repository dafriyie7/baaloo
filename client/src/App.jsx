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

const ProtectedRoute = ({ isLoggedIn, redirectPath = "/login" }) => {
	if (!isLoggedIn) {
		return <Navigate to={redirectPath} replace />;
	}
	return <Outlet />;
};

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
					<Route path="how-to-play" element={<About />} />
					<Route path="scratch/:code" element={<Scan />} />
				</Route>

				<Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
					<Route path="/admin" element={<Layout />}>
						<Route index element={<Manage />} />
						<Route path="players" element={<Players />} />
						<Route path="codes" element={<Codes />} />
						<Route path="profile" element={<Profile />} />
					</Route>
				</Route>
			</Routes>
		</div>
	);
};

export default App;
