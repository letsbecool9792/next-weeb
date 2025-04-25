import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import GetStarted from "./pages/auth/GetStarted";
import Dashboard from "./pages/Dashboard";

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
        path="/dashboard"
        element={
          <Dashboard
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
