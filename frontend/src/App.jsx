import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ClassPage from "./pages/ClassPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* MAIN */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 🔥 CLASS PAGE */}
        <Route path="/class/:id" element={<ClassPage />} />
      </Routes>
    </Router>
  );
}

export default App;