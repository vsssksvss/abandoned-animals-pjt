// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// 회원가입
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
  }

  // 비밀번호 해시화
  const hashedPassword = await bcrypt.hash(password, 10);

  // 이메일이 이미 존재하는지 확인
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '회원가입 중 오류 발생', error: err.message });
    }

    if (user) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    // 새로운 사용자 정보 DB에 삽입
    db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword],
      function (err) {
        if (err) {
          return res.status(500).json({ message: '회원가입 중 오류 발생', error: err.message });
        }

        // 회원가입 성공 메시지 반환
        res.status(201).json({ message: '회원가입이 완료되었습니다!' });
      }
    );
  });
});

// 로그인
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력하세요.' });
  }

  // 사용자 정보 확인
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: '로그인 중 오류 발생', error: err.message });
    }

    if (!user) {
      return res.status(400).json({ message: '존재하지 않는 이메일입니다.' });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '잘못된 비밀번호입니다.' });
    }

    // 로그인 성공 후 JWT 토큰 발급 (payload에 "id" 속성 사용)
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: '로그인 성공!', token });
  });
});

module.exports = router;
