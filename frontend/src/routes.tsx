import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import { RequireAuth } from "./auth/RequireAuth";
import Landing from "./pages/Landing";

// Every other page is downloaded only when first opened, so the landing page
// does not pay for the chart library, the markdown renderer and the rest.
const GetStarted = lazy(() => import("./pages/auth/GetStarted"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AnimeList = lazy(() => import("./pages/AnimeList"));
const Profile = lazy(() => import("./pages/Profile"));
const AnimeDetail = lazy(() => import("./pages/AnimeDetail"));
const SearchAnime = lazy(() => import("./pages/SearchAnime"));
const Stats = lazy(() => import("./pages/Stats"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Shown for the moment a page's code is downloading
const PageLoading = () => <div className="page-bg" />;

const AppRoutes = () => (
	<Suspense fallback={<PageLoading />}>
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
	</Suspense>
);

export default AppRoutes;
