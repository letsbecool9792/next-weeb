import { Routes, Route } from "react-router-dom";

import { RequireAuth } from "./auth/RequireAuth";
import Landing from "./pages/Landing";
import GetStarted from "./pages/auth/GetStarted";
import AuthCallback from "./pages/auth/AuthCallback";
import AnimeList from "./pages/AnimeList";
import Profile from "./pages/Profile";
import AnimeDetail from "./pages/AnimeDetail";
import SearchAnime from "./pages/SearchAnime";
import Stats from "./pages/Stats";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Recommendations from "./pages/Recommendations";

const AppRoutes = () => (
	<Routes>
		{/* Open to everyone */}
		<Route path="/" element={<Landing />} />
		<Route path="/get-started" element={<GetStarted />} />
		<Route path="/auth/callback" element={<AuthCallback />} />

		{/* Logged-in only: RequireAuth sends everyone else to /get-started */}
		<Route element={<RequireAuth />}>
			<Route path="/dashboard" element={<Dashboard />} />
			<Route path="/animelist" element={<AnimeList />} />
			<Route path="/profile" element={<Profile />} />
			<Route path="/anime/:anime_id" element={<AnimeDetail />} />
			<Route path="/search" element={<SearchAnime />} />
			<Route path="/stats" element={<Stats />} />
			<Route path="/recommendations" element={<Recommendations />} />
		</Route>

		{/* 404 Catch-all route */}
		<Route path="*" element={<NotFound />} />
	</Routes>
);

export default AppRoutes;
