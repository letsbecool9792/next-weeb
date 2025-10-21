import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import GetStarted from "./pages/auth/GetStarted";
import AnimeList from "./pages/AnimeList";
import Profile from "./pages/Profile";
import AnimeDetail from "./pages/AnimeDetail";
import SearchAnime from "./pages/SearchAnime";
import Stats from "./pages/Stats";
import NotFound from "./pages/NotFound";

type AppRoutesProps = {
	isLoggedIn: boolean;
	setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppRoutes = ({ isLoggedIn, setIsLoggedIn }: AppRoutesProps) => {
	return (
	<Routes>
		<Route path="/" element={<Landing />} />

		<Route
			path="/get-started"
			element={
				<GetStarted
				isLoggedIn={isLoggedIn}
				setIsLoggedIn={setIsLoggedIn}
				/>
			}
		/>

		<Route
			path="/animelist"
			element={
				<AnimeList
				isLoggedIn={isLoggedIn}
				setIsLoggedIn={setIsLoggedIn}
				/>
			}
		/>

		<Route
			path="/profile"
			element={
				<Profile 
				setIsLoggedIn={setIsLoggedIn} 
				/>
			}
		/>

		<Route 
            path="/anime/:anime_id" 
            element={
			<AnimeDetail setIsLoggedIn={setIsLoggedIn} />
		    }
        />

		<Route
			path="/search"
			element={
				<SearchAnime setIsLoggedIn={setIsLoggedIn}/>
			}
		/>

		<Route 
			path="/stats" 
			element={
				<Stats setIsLoggedIn={setIsLoggedIn} />
			} 
		/>

		{/* 404 Catch-all route */}
		<Route 
			path="*" 
			element={<NotFound />} 
		/>
	</Routes>
	);
};

export default AppRoutes;
