import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import "./home.css";

function Home() {
  const socketRef = useRef(null);

  // โหลดค่าจาก localStorage ถ้ามี ไม่งั้นใช้ค่า default
  const [systemOn, setSystemOn] = useState(() => {
    const val = localStorage.getItem("systemOn");
    return val === null ? true : val === "true";
  });
  const [mode, setMode] = useState("image");
  const [second, setSecond] = useState("");
  const [minute, setMinute] = useState("");
  const [hour, setHour] = useState("");
  const [price, setPrice] = useState("");
  const [imageOn, setImageOn] = useState(() => {
    const val = localStorage.getItem("imageOn");
    return val === null ? true : val === "true";
  }); // สวิตช์สำหรับรูปภาพ
  const [textOn, setTextOn] = useState(() => {
    const val = localStorage.getItem("textOn");
    return val === null ? true : val === "true";
  });   // สวิตช์สำหรับข้อความ
  const navigate = useNavigate();

  // ตรวจสอบว่ากรอกเวลาอย่างน้อย 1 ช่อง และกรอกราคา
  const isTimeSet = !!second || !!minute || !!hour;
  const isPriceSet = !!price;

  useEffect(() => {
    // เชื่อมต่อ socket
    socketRef.current = io("http://localhost:4000");
    // รับสถานะล่าสุดจาก backend
    socketRef.current.on("status", (data) => {
      setSystemOn(data.systemOn);
      setImageOn(data.imageOn);
      setTextOn(data.textOn);
      // ถ้ามี settings ก็อัปเดตด้วย (ถ้าต้องการ)
    });
    return () => socketRef.current.disconnect();
  }, []);

  // ส่งสถานะไป backend ทุกครั้งที่เปลี่ยน
  const handleToggleSystem = () => {
    const newVal = !systemOn;
    setSystemOn(newVal);
    if (!newVal) {
      setImageOn(false);
      setTextOn(false);
      socketRef.current.emit("updateStatus", { systemOn: newVal, imageOn: false, textOn: false });
    } else {
      socketRef.current.emit("updateStatus", { systemOn: newVal });
    }
  };

  const handleToggleImage = () => {
    if (systemOn) {
      const newVal = !imageOn;
      setImageOn(newVal);
      socketRef.current.emit("updateStatus", { imageOn: newVal });
    }
  };

  const handleToggleText = () => {
    if (systemOn) {
      const newVal = !textOn;
      setTextOn(newVal);
      socketRef.current.emit("updateStatus", { textOn: newVal });
    }
  };

  const handleSave = () => {
    if (!isTimeSet || !isPriceSet) return;
    const newRecord = {
      date: new Date().toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      duration: `${hour ? hour + " ชั่วโมง " : ""}${
        minute ? minute + " นาที " : ""
      }${second ? second + " วินาที" : ""}`,
      price: price + " ฿",
      id: Date.now(),
      mode: mode,
    };
    socketRef.current.emit("addSetting", newRecord);
    alert(
      `บันทึกสำเร็จ\nประเภท: ${mode === "image" ? "รูปภาพ" : "ข้อความ"}\nเวลา: ${hour} ชม. ${minute} นาที ${second} วินาที\nราคา: ${price} บาท`
    );
  };

  // อัปเดต localStorage ทุกครั้งที่สถานะเปลี่ยน
  useEffect(() => {
    localStorage.setItem("systemOn", systemOn);
  }, [systemOn]);
  useEffect(() => {
    localStorage.setItem("imageOn", imageOn);
  }, [imageOn]);
  useEffect(() => {
    localStorage.setItem("textOn", textOn);
  }, [textOn]);

  return (
    <div className="home-container">
      {/* Header bar */}
      <header
        className="main-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          maxWidth: "100vw",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.2rem 2.5rem",
          boxSizing: "border-box",
          background: "#fff",
          boxShadow: "0 2px 12px rgba(30, 41, 59, 0.08)",
        }}
      >
        {/* ซ้าย */}
        <div
          className="main-header-title"
          style={{
            fontSize: "2.2rem",
            color: "#1a237e",
            fontWeight: "bold",
            textAlign: "left",
            flex: 1,
          }}
        >
          CMS ADMIN
        </div>
        {/* กลาง + ขวา (รวมกันเป็นแถวเดียว) */}
        <div
          style={{
            flex: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* ประวัติการตั้งเวลา */}
          <div
            style={{
              fontSize: "1.25rem",
              color: "#222",
              fontWeight: "500",
              cursor: "pointer",
              userSelect: "none",
              transition: "all 0.15s",
              display: "inline-block",
            }}
            onClick={() => navigate("/time-history")}
            onMouseOver={e => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.04)";
              e.currentTarget.style.textDecoration = "underline";
              e.currentTarget.style.textDecorationColor = "#222";
              e.currentTarget.style.textDecorationThickness = "2px";
              e.currentTarget.style.textUnderlineOffset = "4px";
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            ประวัติการตั้งเวลา
          </div>
          {/* ประวัติการตรวจสอบ */}
          <div
            style={{
              fontSize: "1.25rem",
              color: "#222",
              fontWeight: "500",
              cursor: "pointer",
              userSelect: "none",
              transition: "all 0.15s",
              display: "inline-block",
            }}
            onClick={() => navigate("/check-history")}
            onMouseOver={e => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.04)";
              e.currentTarget.style.textDecoration = "underline";
              e.currentTarget.style.textDecorationColor = "#222";
              e.currentTarget.style.textDecorationThickness = "2px";
              e.currentTarget.style.textUnderlineOffset = "4px";
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            ประวัติการตรวจสอบ
          </div>
        </div>
        <div
          className="status-row-header"
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          {/* เพิ่มปุ่มลิงก์จากโค้ดใหม่ */}
          <Link to="/stat-slip">
            <button
              style={{
                width: 130,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 0",
                fontWeight: 500,
                fontSize: "1rem",
                boxShadow: "0 2px 8px rgba(30,41,59,0.08)",
                transition: "background 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                marginRight: 18
              }}
              onMouseOver={e => e.currentTarget.style.background = "#1d4ed8"}
              onMouseOut={e => e.currentTarget.style.background = "#2563eb"}
            >
              Check slip
            </button>
          </Link>
          <Link to="/report">
            <button
              style={{
                width: 130,
                background: "#64748b",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 0",
                fontWeight: 500,
                fontSize: "1rem",
                boxShadow: "0 2px 8px rgba(30,41,59,0.08)",
                transition: "background 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                marginRight: 18
              }}
              onMouseOver={e => e.currentTarget.style.background = "#475569"}
              onMouseOut={e => e.currentTarget.style.background = "#64748b"}
            >
              Report
            </button>
          </Link>
          <Link to="/image-queue">
            <button
              style={{
                width: 130,
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 0",
                fontWeight: 500,
                fontSize: "1rem",
                boxShadow: "0 2px 8px rgba(30,41,59,0.08)",
                transition: "background 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                marginRight: 18
              }}
              onMouseOver={e => e.currentTarget.style.background = "#b91c1c"}
              onMouseOut={e => e.currentTarget.style.background = "#dc2626"}
            >
              Image Queue
            </button>
          </Link>
          <Link to="/checklist">
            <button
              style={{
                width: 130,
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 0",
                fontWeight: 500,
                fontSize: "1rem",
                boxShadow: "0 2px 8px rgba(30,41,59,0.08)",
                transition: "background 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                marginRight: 32
              }}
              onMouseOver={e => e.currentTarget.style.background = "#047857"}
              onMouseOut={e => e.currentTarget.style.background = "#059669"}
            >
              Checklist
            </button>
          </Link>
          <span className="status-label" style={{ marginRight: 10 }}>
            สถานะระบบ:
          </span>
          <div
            className={`switch-track ${systemOn ? "switch-on" : "switch-off"}`}
            onClick={handleToggleSystem}
            style={{ cursor: "pointer" }}
            title={systemOn ? "ปิดระบบ" : "เปิดระบบ"}
          >
            <div className="switch-thumb"></div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content" style={{ marginTop: "90px" }}>
        <section className="mode-row">
          <span>ตั้งค่าสำหรับ:</span>
          <button
            className={`mode-btn${mode === "image" ? " active" : ""}`}
            onClick={() => setMode("image")}
            disabled={!systemOn}
          >
            รูปภาพ
          </button>
          <button
            className={`mode-btn${mode === "text" ? " active" : ""}`}
            onClick={() => setMode("text")}
            disabled={!systemOn}
          >
            ข้อความ
          </button>
        </section>
        {!systemOn && (
          <div className="system-off-msg" style={{ marginTop: 10 }}>
            * ระบบถูกปิด ฝั่ง user จะไม่สามารถเลือกส่งภาพหรือข้อความได้
          </div>
        )}

        <section className="setting-row">
          <div className="time-row">
            <label>ตั้งเวลา :</label>
            <div className="time-inputs">
              <input
                type="number"
                min="1"
                max="59"
                placeholder="วินาที"
                value={second}
                onChange={(e) => setSecond(e.target.value)}
                disabled={!systemOn}
              />
              <input
                type="number"
                min="1"
                max="59"
                placeholder="นาที"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                disabled={!systemOn}
              />
              <input
                type="number"
                min="1"
                max="24"
                placeholder="ชั่วโมง"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                disabled={!systemOn}
              />
            </div>
          </div>

          <div className="price-row">
            <label>ตั้งราคา (บาท):</label>
            <input
              type="number"
              min="1"
              placeholder="ราคา"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={!systemOn}
            />
          </div>

          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!systemOn || !isTimeSet || !isPriceSet}
          >
            บันทึก
          </button>
        </section>

        {/* สวิตช์เปิดปิดสำหรับแต่ละโหมด */}
        <div style={{ display: "flex", gap: 40, marginTop: 40, justifyContent: "center" }}>
          {/* สวิตช์รูปภาพ */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>รูปภาพ:</span>
            <div
              className={`switch-track ${imageOn ? "switch-on" : "switch-off"}`}
              onClick={handleToggleImage}
              style={{
                cursor: systemOn ? "pointer" : "not-allowed",
                opacity: systemOn ? 1 : 0.5,
              }}
              title={imageOn ? "ปิดโหมดรูปภาพ" : "เปิดโหมดรูปภาพ"}
            >
              <div className="switch-thumb"></div>
            </div>
            <span style={{ marginLeft: 8, color: imageOn ? "#388e3c" : "#bdbdbd" }}>
              {imageOn ? "เปิด" : "ปิด"}
            </span>
          </div>
          {/* สวิตช์ข้อความ */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>ข้อความ:</span>
            <div
              className={`switch-track ${textOn ? "switch-on" : "switch-off"}`}
              onClick={handleToggleText}
              style={{
                cursor: systemOn ? "pointer" : "not-allowed",
                opacity: systemOn ? 1 : 0.5,
              }}
              title={textOn ? "ปิดโหมดข้อความ" : "เปิดโหมดข้อความ"}
            >
              <div className="switch-thumb"></div>
            </div>
            <span style={{ marginLeft: 8, color: textOn ? "#388e3c" : "#bdbdbd" }}>
              {textOn ? "เปิด" : "ปิด"}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;