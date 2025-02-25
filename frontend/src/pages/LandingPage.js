import React from "react";
import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div>
      <h1>Welcome to the MAL Recommendation App</h1>
      <Link to="/auth">Sign In / Sign Up</Link>
    </div>
  );
}

export default LandingPage;
