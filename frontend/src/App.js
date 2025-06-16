import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./Register"; // นำเข้า Register
import Home from "./home"; // นำเข้า Home
import TimeHistory  from "./TimeHistory"; // นำเข้า TimeHistory

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} /> {/* หน้าแรกสุด */}
        <Route path="/home" element={<Home />} /> {/* หน้า Home */}
        <Route path="/time-history" element={<TimeHistory />} /> {/* หน้า TimeHistory */}
      </Routes>
    </Router>
  );  
}

export default App;
