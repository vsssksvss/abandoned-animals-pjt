// index.js
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const authRouter = require('./routes/auth');
const articleRouter = require('./routes/articles'); // 게시판 라우트
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json()); // JSON 본문 파싱

// 라우트 연결
app.use('/auth', authRouter);
app.use('/articles', articleRouter); // 게시판 라우트
app.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
});
