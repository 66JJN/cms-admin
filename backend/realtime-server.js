const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// เก็บสถานะกลาง
let status = {
  systemOn: true,
  imageOn: true,
  textOn: true,
  settings: [] // เก็บรายละเอียดการตั้งค่าต่างๆ
};

// REST API (optional สำหรับ fallback)
app.get("/api/status", (req, res) => res.json(status));

// WebSocket
io.on("connection", (socket) => {
  // ส่งสถานะล่าสุดให้ client ที่เพิ่งเชื่อมต่อ
  socket.emit("status", status);

  // รับสถานะใหม่จาก admin
  socket.on("updateStatus", (newStatus) => {
    console.log("updateStatus from admin:", newStatus); // เพิ่มตรงนี้
    status = { ...status, ...newStatus };
    io.emit("status", status); // broadcast ไปทุก client
  });

  // รับการตั้งค่าใหม่จาก admin
  socket.on("addSetting", (setting) => {
    console.log("addSetting from admin:", setting); // เพิ่มตรงนี้
    status.settings.unshift(setting);
    io.emit("status", status); // broadcast ไปทุก client
  });

  // รับ event ลบการตั้งค่าจาก client
  socket.on("removeSetting", (id) => {
    status.settings = status.settings.filter(item => item.id != id); // ใช้ !=
    io.emit("status", status);
  });
});

server.listen(4000, () => console.log("Server running on port 4000"));