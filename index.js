const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./db');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// 기존 라우터 다시 연결하기
const authRouter = require('./routes/auth');
const articleRouter = require('./routes/articles');
const commentRouter = require('./routes/comments');
const animalRouter = require('./routes/animal');

// API 연결 복구
app.use('/auth', authRouter);
app.use('/articles', articleRouter);
app.use('/articles', commentRouter);
app.use('/animals/api', animalRouter);

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 정적 홈
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 동물 리스트 페이지
app.get('/animals', async (req, res) => {
  const animals = await db.all('SELECT * FROM animals');
  let html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>입양 동물</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <h1>입양 가능한 동물들</h1>
      <div class="grid">
  `;

  for (const a of animals) {
    html += `
      <div class="card">
        <img src="${a.image_url}" alt="사진">
        <h3>${a.name} (${a.gender})</h3>
        <p>품종: ${a.breed}</p>
        <p>보호소: ${a.location}</p>
      </div>
    `;
  }

  html += `
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

// 게시판 페이지
app.get('/board', async (req, res) => {
  const articles = await db.all('SELECT * FROM articles ORDER BY id DESC');
  let html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>게시판</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <h1>게시판</h1>
      <ul>
  `;

  for (const a of articles) {
    html += `<li><strong>${a.title}</strong><p>${a.content}</p></li>`;
  }

  html += `
      </ul>
      <hr>
      <h3>새 글 작성</h3>
      <form method="POST" action="/api/articles">
        <input name="title" placeholder="제목" required><br>
        <textarea name="content" placeholder="내용" required></textarea><br>
        <button type="submit">작성</button>
      </form>
    </body>
    </html>
  `;

  res.send(html);
});

// 게시글 작성
app.post('/api/articles', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).send('제목과 내용 필요');
  await db.run('INSERT INTO articles (title, content, user_id) VALUES (?, ?, ?)', [title, content, 1]);
  res.redirect('/board');
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행: http://localhost:${PORT}`);
});
