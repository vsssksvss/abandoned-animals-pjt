const express = require('express');
const path = require('path'); // ← HTML 렌더링용
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./db');

const authRouter = require('./routes/auth');
const articleRouter = require('./routes/articles');
const commentRouter = require('./routes/comments');
const animalRouter = require('./routes/animal');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // ← form 처리 위해 필요
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API 라우트
app.use('/auth', authRouter);
app.use('/articles', articleRouter);
app.use('/articles', commentRouter);
app.use('/animals/api', animalRouter); // API는 animals/api

// 웹 페이지용 라우트
app.get('/animals', async (req, res) => {
  const animals = await db.all('SELECT * FROM animals');
  res.render('animals', { animals });
});

app.get('/board', async (req, res) => {
  const articles = await db.all('SELECT * FROM articles ORDER BY id DESC');
  res.render('board', { articles });
});

// 게시글 작성 POST (HTML form용)
app.post('/api/articles', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).send('제목/내용 입력 누락');
  await db.run('INSERT INTO articles (title, content, user_id) VALUES (?, ?, ?)', [
    title,
    content,
    1, // 로그인 없이 임시 user_id 1
  ]);
  res.redirect('/board');
});

app.get('/', (req, res) => {
  res.send('<h2>🧡 유기동물 커뮤니티: <a href=\"/animals\">입양</a> | <a href=\"/board\">게시판</a></h2>');
});

app.listen(PORT, () => {
  console.log(`✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
