const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// 회원가입
// 가입 시 role이 별도로 넘어오지 않으면 기본값을 'user'로 설정합니다.
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // 기존에 가입된 사용자 확인
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return res.status(500).json({ message: '회원가입 중 오류 발생', error: err.message });
      }
      if (user) {
        return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
      }
      
      // role을 명시하지 않으면 기본 'user'로 설정 (관리자는 별도로 설정)
      const userRole = role ? role : 'user';
      db.run(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, userRole],
        function (err) {
          if (err) {
            return res.status(500).json({ message: '회원가입 중 오류 발생', error: err.message });
          }
          res.status(201).json({ message: '회원가입이 완료되었습니다!' });
        }
      );
    });
  } catch (error) {
    return res.status(500).json({ message: '회원가입 중 에러 발생', error: error.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력하세요.' });
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: '로그인 중 오류 발생', error: err.message });
      }
      if (!user) {
        return res.status(400).json({ message: '존재하지 않는 이메일입니다.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: '잘못된 비밀번호입니다.' });
      }

      // JWT 생성 시 role 정보도 함께 포함
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      res.status(200).json({ message: '로그인 성공!', token });
    });
  } catch (error) {
    return res.status(500).json({ message: '로그인 중 에러 발생', error: error.message });
  }
});

module.exports = router;
