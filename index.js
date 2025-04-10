require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db'); // 데이터베이스 모듈

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, 'public')));

// 라우터 등록
const authRouter = require('./routes/auth');
const articleRouter = require('./routes/articles');
const commentRouter = require('./routes/comments');
const animalRouter = require('./routes/animal');

// URL 경로가 겹치지 않도록 일부 라우트는 하위 경로로 수정합니다.
app.use('/auth', authRouter);
app.use('/articles', articleRouter);
app.use('/articles/comments', commentRouter);
app.use('/animals/api', animalRouter);

// 기본 페이지: public/index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 동물 리스트 페이지 HTML 제공 – API 대신 사용 가능
app.get('/animals', async (req, res) => {
  try {
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
    animals.forEach(a => {
      html += `
        <div class="card">
          <img src="${a.image_url}" alt="사진">
          <h3>${a.name} (${a.gender})</h3>
          <p>품종: ${a.breed}</p>
          <p>보호소: ${a.location}</p>
        </div>
      `;
    });
    html += `
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).send('동물 리스트를 가져오는 중 오류 발생');
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버: http://localhost:${PORT}`);
});
