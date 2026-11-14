import { BrowserRouter as Router } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { AuthProvider } from "./auth/AuthProvider";
import AppRoutes from "./routes";
import { useSpotlight } from "./utils/useSpotlight";

function App() {
  // Cards glow where the cursor is, on every page
  useSpotlight();

  return (
    // reducedMotion="user": people who turned on "reduce motion" in their OS get no animations
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
