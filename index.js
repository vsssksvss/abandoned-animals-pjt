require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


const authRouter = require('./routes/auth');
const articleRouter = require('./routes/articles');
const commentRouter = require('./routes/comments');
const uploadRouter = require('./routes/upload');
const petfinderRouter = require('./routes/petfinder');

app.use('/auth', authRouter);
app.use('/articles', articleRouter);
app.use('/articles/comments', commentRouter);
app.use('/petfinder', petfinderRouter);
app.use('/upload', uploadRouter);


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 선택: HTML 형태 동물 리스트 페이지 (테스트용)
app.get('/animals', async (req, res) => {
  try {
    const animals = await db.all('SELECT * FROM animals');
    let html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>입양 동물</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <h1>입양 가능한 동물들</h1>
        <div class="grid">
    `;
    animals.forEach(a => {
      html += `
        <div class="card">
          <img src="${a.image_url || ''}" alt="동물 사진">
          <h3>${a.name || '정보없음'} (${a.gender || '정보없음'})</h3>
          <p>품종: ${a.breed || ''}</p>
          <p>보호소: ${a.location || ''}</p>
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
    console.error("동물 리스트 HTML 렌더링 오류:", error);
    res.status(500).send('동물 리스트를 가져오는 중 오류 발생');
  }
});

app.listen(PORT, () => {
  console.log(`서버 시작: http://localhost:${PORT}`);
});
