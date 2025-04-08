import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import FinanceFlowApp from "./FinanceFlowApp";

function App() {
  return (
    <Router>
      <Routes>
        {/* Root path shows the Landing Page */}
        <Route path="/" element={<LandingPage />} />
        {/* Dashboard at /app */}
        <Route path="/app" element={<FinanceFlowApp />} />
        {/* Fallback: Redirect any unknown routes to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;