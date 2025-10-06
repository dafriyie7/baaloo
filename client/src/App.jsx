import { Route, Routes } from "react-router-dom"
import Codes from "./Pages/Codes"
import Scan from "./Pages/Scan"
import Layout from "./Components/Layout"
import { Toaster } from "react-hot-toast"

import Players from "./Pages/Players"

const App = () => {
  return (
		<div>
			<Toaster />
			<Routes>
				<Route path="/admin" element={<Layout />}>
				  <Route index element={<Codes />} />
				  <Route path="players" element={<Players />} />
				  <Route path="codes" element={<Codes />} />
				</Route>

				<Route path="/" element={<Layout />}>
					<Route index element={<Scan />} />
				</Route>
			</Routes>
		</div>
  );
}

export default App