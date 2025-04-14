const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth_mid'); // 인증 미들웨어
const router = express.Router();

// 게시글 작성 (로그인한 사용자만)
router.post('/', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id; // JWT payload의 "id" 사용

  if (!title || !content) return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
  
  db.run('INSERT INTO articles (title, content, user_id) VALUES (?, ?, ?)', [title, content, userId], function(err) {
    if (err) return res.status(500).json({ message: '게시물 작성 중 오류 발생', error: err.message });
    res.status(201).json({ message: '게시물이 작성되었습니다!', articleId: this.lastID });
  });
});

// 게시글 조회 (작성자 이메일 포함)
router.get('/', (req, res) => {
  const sql = `
    SELECT articles.*, users.email AS user_email, datetime(articles.created_at, 'localtime') AS created_at 
    FROM articles 
    LEFT JOIN users ON articles.user_id = users.id
    ORDER BY articles.id DESC
  `;
  db.all(sql, (err, articles) => {
    if (err) return res.status(500).json({ message: '게시글 불러오는 중 오류 발생', error: err.message });
    res.status(200).json({ articles });
  });
});

// 게시글 수정 (작성자만 가능)
router.put('/:id', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  const articleId = req.params.id;
  const userId = req.user.id;

  if (!title || !content) return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
  
  db.get('SELECT * FROM articles WHERE id = ?', [articleId], (err, article) => {
    if (err) return res.status(500).json({ message: '게시글 수정 중 오류 발생', error: err.message });
    if (!article) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    if (article.user_id !== userId) return res.status(403).json({ message: '본인이 작성한 게시글만 수정할 수 있습니다.' });
    
    db.run('UPDATE articles SET title = ?, content = ? WHERE id = ?', [title, content, articleId], function(err) {
      if (err) return res.status(500).json({ message: '게시글 수정 중 오류 발생', error: err.message });
      res.status(200).json({ message: '게시글이 수정되었습니다.' });
    });
  });
});

// 게시글 삭제 (작성자만 가능)
router.delete('/:id', authenticateToken, (req, res) => {
  const articleId = req.params.id;
  const userId = req.user.id;
  
  db.get('SELECT * FROM articles WHERE id = ?', [articleId], (err, article) => {
    if (err) return res.status(500).json({ message: '게시글 삭제 중 오류 발생', error: err.message });
    if (!article) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    if (article.user_id !== userId) return res.status(403).json({ message: '본인이 작성한 게시글만 삭제할 수 있습니다.' });
    
    db.run('DELETE FROM articles WHERE id = ?', [articleId], function(err) {
      if (err) return res.status(500).json({ message: '게시글 삭제 중 오류 발생', error: err.message });
      res.status(200).json({ message: '게시글이 삭제되었습니다.' });
    });
  });
});

module.exports = router;
