require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const bcrypt = require("bcrypt");

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const users = JSON.parse(await fs.readFile("users.json", "utf-8"));

    // ตรวจสอบ Username และ Password ที่เข้ารหัส
    const user = users.find((u) => u.username === username);
    if (user && bcrypt.compareSync(password, user.password)) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error reading users.json:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

