// routes/comments.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// 댓글 조회 라우트: articleId에 해당하는 댓글을 배열로 반환
router.get('/:articleId', (req, res) => {
  const articleId = req.params.articleId;
  
  db.all('SELECT * FROM comments WHERE article_id = ?', [articleId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: '댓글 불러오기 실패', error: err.message });
    }
    // rows는 댓글 객체의 배열입니다.
    res.json(rows);
  });
});

// 댓글 작성 라우트
router.post('/:articleId', (req, res) => {
  const articleId = req.params.articleId;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: '내용을 입력해주세요.' });
  }

  db.run('INSERT INTO comments (article_id, content) VALUES (?, ?)', [articleId, content], function(err) {
    if (err) {
      return res.status(500).json({ message: '댓글 작성 실패', error: err.message });
    }
    res.json({ message: '댓글 작성 성공', commentId: this.lastID });
  });
});

module.exports = router;
