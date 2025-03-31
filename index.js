// index.js
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');

const authRouter = require('./routes/auth');
const articleRouter = require('./routes/articles');
const commentRouter = require('./routes/comments'); // 댓글 라우트
const animalsRouter = require('./routes/animals'); // animals 라우트 추가
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// 라우트 연결
app.use('/auth', authRouter);
app.use('/articles', articleRouter);
app.use('/articles', commentRouter); // 댓글 라우트
app.use('/animals', animalsRouter); // animals 라우트 추가

app.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
});
