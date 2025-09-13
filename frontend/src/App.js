import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./Register"; // นำเข้า Register
import Home from "./home"; // นำเข้า Home
import ProfileSetup from "./ProfileSetup"; // นำเข้า ProfileSetup
import Report from "./AdminReport"; // นำเข้า Report
import AdminStatSlip from "./Stat-slip"; // นำเข้า AdminStatSlip
import ImageQueue from "./ImageQueue"; // นำเข้า ImageQueue
import TimeHistory  from "./TimeHistory"; // นำเข้า TimeHistory
import CheckHistory from "./CheckHistory"; // นำเข้า CheckHistory

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} /> {/* หน้าแรกสุด */}
        <Route path="/home" element={<Home />} /> {/* หน้า Home */}
        <Route path="/profile-setup" element={<ProfileSetup />} /> {/* หน้า ProfileSetup */}
        <Route path="/report" element={<Report />} /> {/* หน้า Report */}
        <Route path="/stat-slip" element={<AdminStatSlip />} /> {/* หน้า AdminStatSlip */}
        <Route path="/image-queue" element={<ImageQueue />} /> {/* หน้า ImageQueue */}
        <Route path="/time-history" element={<TimeHistory />} /> {/* หน้า TimeHistory */}
        <Route path="/check-history" element={<CheckHistory />} /> {/* หน้า CheckHistory */}
      </Routes>
    </Router>
  );  
}

export default App;
