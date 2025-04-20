const db = require("./db");

db.serialize(() => {
  // 외래키 제약을 활성화합니다.
  db.run("PRAGMA foreign_keys = ON;");

  // users 테이블 생성
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, (err) => {
    if (err) console.error("users 테이블 생성 오류:", err.message);
    else console.log("✅ users 테이블 준비 완료");
  });

  // articles 테이블 생성
  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      category TEXT DEFAULT '전체',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `, (err) => {
    if (err) console.error("articles 테이블 생성 오류:", err.message);
    else console.log("✅ articles 테이블 준비 완료");
  });

  // comments 테이블 생성
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      article_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY (article_id) REFERENCES articles(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `, (err) => {
    if (err) console.error("comments 테이블 생성 오류:", err.message);
    else console.log("✅ comments 테이블 준비 완료");
  });

  // animals 테이블 생성
//   db.run(`
//     CREATE TABLE IF NOT EXISTS animals (
//       id TEXT PRIMARY KEY,
//       name TEXT,
//       breed TEXT,
//       age TEXT,
//       gender TEXT,
//       image_url TEXT,
//       location TEXT
//     );
//   `, (err) => {
//     if (err) console.error("animals 테이블 생성 오류:", err.message);
//     else console.log("✅ animals 테이블 준비 완료!");
//   });
});
