// middleware/auth.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// JWT 검증 미들웨어
function authenticateToken(req, res, next) {
  // Authorization 헤더에서 토큰 추출 ("Bearer <토큰>" 형식)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer" 제거

  if (!token) {
    return res.status(403).json({ message: '토큰이 없습니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '토큰 검증 실패', error: err });
    }
    req.user = user; // JWT에서 user 정보를 req 객체에 저장
    next();
  });
}

module.exports = { authenticateToken };
