const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const SETTINGS_FILE = "./settings.json";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// โหลด settings จากไฟล์ (ถ้ามี)
function loadSettings() {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// บันทึก settings ลงไฟล์
function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
}

// เก็บสถานะกลาง
let status = {
  systemOn: true,
  imageOn: true,
  textOn: true,
  settings: loadSettings() // โหลดจากไฟล์
};

// REST API (optional สำหรับ fallback)
app.get("/api/status", (req, res) => res.json(status));

// WebSocket
io.on("connection", (socket) => {
  // ส่งสถานะล่าสุดให้ client ที่เพิ่งเชื่อมต่อ
  socket.emit("status", status);

  // รับสถานะใหม่จาก admin
  socket.on("updateStatus", (newStatus) => {
    status = { ...status, ...newStatus };
    io.emit("status", status);
  });

  // รับการตั้งค่าใหม่จาก admin
  socket.on("addSetting", (setting) => {
    status.settings.unshift(setting);
    saveSettings(status.settings); // บันทึกทุกครั้งที่เพิ่ม
    io.emit("status", status);
  });

  // รับ event ลบการตั้งค่าจาก client
  socket.on("removeSetting", (id) => {
    status.settings = status.settings.filter(item => item.id != id);
    saveSettings(status.settings); // บันทึกทุกครั้งที่ลบ
    io.emit("status", status);
  });
});

server.listen(4000, () => console.log("Server running on port 4000"));