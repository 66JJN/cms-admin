import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fs from "fs";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ฟังก์ชัน hash/verify password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// สร้างโฟลเดอร์ uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ตั้งค่าการเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// เสิร์ฟไฟล์รูปภาพ
app.use('/uploads', express.static(uploadsDir));

// เก็บข้อมูลรูปภาพ (ในการใช้งานจริงควรใช้ฐานข้อมูล)
let imageQueue = [];

// เก็บข้อมูล stat-slip (ควรใช้ฐานข้อมูลจริง ในตัวอย่างใช้ array)
let statSlips = [];

// เก็บประวัติการตรวจสอบ
let checkHistory = [];
const checkHistoryPath = path.join(__dirname, "check-history.json");
if (fs.existsSync(checkHistoryPath)) {
  try {
    checkHistory = JSON.parse(fs.readFileSync(checkHistoryPath, "utf8"));
  } catch (e) {
    checkHistory = [];
  }
}
function saveCheckHistory() {
  fs.writeFileSync(checkHistoryPath, JSON.stringify(checkHistory, null, 2));
}

// ฟังก์ชันโหลดข้อมูลผู้ใช้จาก users.json
async function loadUsers() {
  try {
    const data = await fs.promises.readFile("users.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.log("users.json not found, creating default users...");
    // สร้างผู้ใช้เริ่มต้นถ้าไม่มีไฟล์
    const defaultUsers = [
      { username: "admin", password: await hashPassword("admin123") },
      { username: "cms1", password: await hashPassword("dfhy1785") },
      { username: "cms2", password: await hashPassword("sdgsd5996") },
    ];
    await fs.promises.writeFile("users.json", JSON.stringify(defaultUsers, null, 2));
    console.log("Default users created and saved to users.json");
    return defaultUsers;
  }
}

// ฟังก์ชันค้นหาผู้ใช้
async function findUser(username) {
  const users = await loadUsers();
  return users.find(user => user.username === username);
}

// API สำหรับ login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" 
      });
    }
    const user = await findUser(username);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" 
      });
    }
    const isPasswordValid = await verifyPassword(password, user.password);
    if (isPasswordValid) {
      res.json({ 
        success: true, 
        message: "เข้าสู่ระบบสำเร็จ",
        user: {
          username: user.username,
          role: "admin"
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" 
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ 
      success: false, 
      message: "เกิดข้อผิดพลาดในระบบ" 
    });
  }
});

// API สำหรับรับข้อมูลจาก User backend
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    const { text, type, time, price, sender, textColor } = req.body;
    const newImage = {
      id: Date.now().toString(),
      text: text || "",
      type,
      time: parseInt(time) || 0,
      price: parseFloat(price) || 0,
      sender: sender || "Unknown",
      textColor: textColor || 'white',
      filePath: req.file ? `/uploads/${req.file.filename}` : null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      receivedAt: new Date().toISOString()
    };
    imageQueue.push(newImage);
    res.json({ success: true, message: 'Upload received successfully' });
  } catch (error) {
    console.error('Error receiving upload:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API สำหรับดูคิวรูปภาพ - เรียงตามวันที่เวลา (เก่าไปใหม่)
app.get("/api/queue", (req, res) => {
  try {
    const sortedImages = imageQueue.sort((a, b) => {
      const dateA = new Date(a.receivedAt);
      const dateB = new Date(b.receivedAt);
      return dateA - dateB;
    });
    res.json(sortedImages);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API สำหรับอนุมัติรูปภาพ
app.post("/api/approve/:id", (req, res) => {
  try {
    const { id } = req.params;
    console.log("Approving image:", id);
    
    const imageIndex = imageQueue.findIndex(img => img.id === id);
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // สร้างข้อมูลที่จะบันทึก
    const approvedImage = {
      ...imageQueue[imageIndex],
      status: 'approved',
      checkedAt: new Date().toISOString()
    };
    checkHistory.push(approvedImage);
    saveCheckHistory();

    // ลบออกจากคิว
    imageQueue.splice(imageIndex, 1);

    console.log('Image approved and saved to history');
    res.json({ success: true, message: 'Image approved and removed from queue' });
  } catch (error) {
    console.error('Error approving image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// เมื่ออนุมัติรูปภาพ
app.post("/api/approve-image", (req, res) => {
  const { id } = req.body;
  const imageIndex = imageQueue.findIndex((img) => img.id === id);
  if (imageIndex !== -1) {
    const approvedImage = {
      ...imageQueue[imageIndex],
      status: "approved",
      checkedAt: new Date().toISOString(),
    };
    checkHistory.push(approvedImage);
    saveCheckHistory();
    imageQueue.splice(imageIndex, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Image not found" });
  }
});

// แก้ไข API ปฏิเสธรูปภาพ
app.post("/api/reject/:id", (req, res) => {
  try {
    const { id } = req.params;
    console.log("Rejecting image:", id);
    
    const imageIndex = imageQueue.findIndex(img => img.id === id);
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // สร้างข้อมูลที่จะบันทึก
    const rejectedImage = {
      ...imageQueue[imageIndex],
      status: 'rejected',
      checkedAt: new Date().toISOString()
    };

    // เพิ่มลงในประวัติ
    checkHistory.push(rejectedImage);
    saveCheckHistory();

    // ลบไฟล์รูปภาพ
    if (imageQueue[imageIndex].filePath) {
      const imagePath = path.join(__dirname, imageQueue[imageIndex].filePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // ลบออกจากคิว
    imageQueue.splice(imageIndex, 1);

    console.log('Image rejected and saved to history');
    res.json({ success: true, message: 'Image rejected and removed from queue' });
  } catch (error) {
    console.error('Error rejecting image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API สำหรับลบรูปภาพที่ถูกปฏิเสธ
app.delete("/api/delete/:id", (req, res) => {
  try {
    const { id } = req.params;
    const imageIndex = imageQueue.findIndex(img => img.id === id);
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    if (imageQueue[imageIndex].filePath) {
      const imagePath = path.join(__dirname, imageQueue[imageIndex].filePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    imageQueue.splice(imageIndex, 1);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API สำหรับสถิติสลิป
app.post("/api/stat-slip", (req, res) => {
  const slip = {
    ...req.body,
    time: new Date().toISOString(),
  };
  statSlips.push(slip);
  res.json({ success: true });
});

// API สำหรับดูรายงานจาก User backend
app.get("/api/admin/report", async (req, res) => {
  try {
    const reportPath = path.join(__dirname, 'report.json');
    if (!fs.existsSync(reportPath)) {
      return res.json([]);
    }
    const data = await fs.promises.readFile(reportPath, 'utf8');
    const reports = JSON.parse(data);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API สำหรับรับรายงานจาก User backend
app.post("/api/report", (req, res) => {
  try {
    const reportPath = path.join(__dirname, 'report.json');
    let reports = [];
    if (fs.existsSync(reportPath)) {
      const data = fs.readFileSync(reportPath, 'utf8');
      reports = JSON.parse(data);
    }
    const newReport = {
      ...req.body,
      id: Date.now().toString(),
      receivedAt: new Date().toISOString()
    };
    reports.push(newReport);
    fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
    res.json({ success: true, message: 'Report received successfully' });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API สำหรับดึงประวัติการตรวจสอบ
app.get("/api/check-history", (req, res) => {
  res.json(checkHistory);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    queueLength: imageQueue.length
  });
});

// ลบทีละรายการ
app.post("/api/delete-history", (req, res) => {
  const { id } = req.body;
  checkHistory = checkHistory.filter(item => item.id !== id);
  fs.writeFileSync(checkHistoryPath, JSON.stringify(checkHistory, null, 2));
  res.json({ success: true });
});

// ลบทั้งหมด
app.post("/api/delete-all-history", (req, res) => {
  checkHistory = [];
  fs.writeFileSync(checkHistoryPath, JSON.stringify(checkHistory, null, 2));
  res.json({ success: true });
});

app.listen(port, async () => {
  console.log(`Admin backend server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Queue API: http://localhost:${port}/api/queue`);
  console.log(`Login API: http://localhost:${port}/login`);
  console.log(`Report API: http://localhost:${port}/api/admin/report`);
  try {
    const users = await loadUsers();
    console.log("Available users:");
    users.forEach(user => {
      console.log(`- ${user.username}`);
  });
  } catch (error) {
    console.error("Error loading users:", error);
  }
});

