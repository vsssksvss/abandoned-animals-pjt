const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) return console.error("❌ DB 연결 실패:", err.message);
  console.log("✅ DB 연결 성공");
});

db.run("PRAGMA foreign_keys = ON");

module.exports = db;
