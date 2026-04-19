import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import Codes from "./Pages/admin/Codes";
import Scan from "./Pages/Scan";
import Landing from "./Pages/Landing";
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
import Batches from "./Pages/admin/Batches";
import Svgs from "./Pages/admin/Svgs";
import AuditLogs from "./Pages/admin/AuditLogs";
import NotFound from "./Pages/NotFound";
import HowToPlay from "./Pages/HowToPlay";
import Maintenance from "./Pages/Maintenance";

const App = () => {
	const { isLoading, isLoggedIn, authChecked, systemSettings, user } = useAppcontext();

	if (!authChecked) {
		return <Loading />;
	}

	// Maintenance Mode Check: 
	// If maintenanceMode is ON and user is NOT an admin, show Maintenance page.
	if (systemSettings.maintenanceMode && !isLoggedIn) {
		return <Maintenance />;
	}

	return (
		<div>
			<Toaster />
			{isLoading && <Loading />}
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />

				<Route path="/" element={<Layout />}>
					<Route index element={<Landing />} />
					<Route path="play" element={<Scan />} />
					<Route path="claim" element={<ClaimWin />} />
					<Route path="how-to-play" element={<HowToPlay />} />
					<Route path="scratch/:code" element={<Scan />} />
					<Route path="about" element={<About />} />
				</Route>
				
				<Route path="/admin" element={isLoggedIn ? <Layout /> : <Login />} >
					<Route index element={<Manage />} />
					<Route path="batches" element={<Batches />} />
					<Route path="players" element={<Players />} />
					<Route path="codes" element={<Codes />} />
					<Route path="svgs" element={<Svgs />} />
					<Route path="profile" element={<Profile />} />
					<Route path="logs" element={<AuditLogs />} />
				</Route>

				<Route path="*" element={<NotFound />} />
			</Routes>
		</div>
	);
};

export default App;

