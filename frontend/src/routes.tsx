import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import GetStarted from "./pages/auth/GetStarted";
import AnimeList from "./pages/AnimeList";
import Profile from "./pages/Profile";

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
            //isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn} 
        />
      }
      />
    </Routes>
  );
};

export default AppRoutes;
