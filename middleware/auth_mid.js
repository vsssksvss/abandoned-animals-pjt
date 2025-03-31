// middleware/auth.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// 인증 미들웨어
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // 'Bearer ' 접두어 제거

  if (!token) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
    req.user = user; // 토큰에서 추출한 사용자 정보를 req.user에 저장
    next();
  });
}

module.exports = authenticateToken;
