import React from "react";
import { Link } from "react-router-dom";

function AuthPage() {
  return (
    <div>
      <h1>Sign In / Sign Up</h1>
      <Link to="/dashboard">Go to Dashboard</Link>
    </div>
  );
}

export default AuthPage;
