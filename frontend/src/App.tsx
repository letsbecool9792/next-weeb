import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import AppRoutes from "./routes";

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
