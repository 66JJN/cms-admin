const fs = require("fs").promises;
const bcrypt = require("bcrypt");

async function hashPasswords() {
  const users = [
    { username: "cms1", password: "dfhy1785" },
    { username: "cms2", password: "sdgsd5996" },
  ];

  const hashedUsers = await Promise.all(
    users.map(async (user) => ({
      username: user.username,
      password: await bcrypt.hash(user.password, 10), // เข้ารหัสรหัสผ่าน
    }))
  );

  await fs.writeFile("users.json", JSON.stringify(hashedUsers, null, 2));
  console.log("Passwords hashed and saved to users.json");
}

hashPasswords();