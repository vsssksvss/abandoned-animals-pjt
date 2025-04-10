// routes/comments.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth_mid');

/*
  DB에 'comments' 테이블이 있다고 가정합니다. 
  (예: CREATE TABLE comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          article_id INTEGER,
          user_id INTEGER,
          content TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
       ))
  필요에 따라 스키마를 조정하세요.
*/

// [C] 댓글 등록 - 로그인한 사용자만 가능
router.post('/:articleId', authenticateToken, (req, res) => {
  const { content } = req.body;
  const articleId = req.params.articleId;
  const userId = req.user.userId; // 로그인 토큰에서 추출한 사용자 ID

  if (!content) {
    return res.status(400).json({ message: '댓글 내용을 입력하세요.' });
  }

  const sql = `INSERT INTO comments (article_id, user_id, content) VALUES (?, ?, ?)`;
  db.run(sql, [articleId, userId, content], function (err) {
    if (err) {
      return res.status(500).json({ message: '댓글 등록 중 오류 발생', error: err.message });
    }
    res.status(201).json({ message: '댓글이 등록되었습니다.', commentId: this.lastID });
  });
});

// [R] 특정 게시물의 모든 댓글 조회 (누구나 가능)
router.get('/:articleId', (req, res) => {
  const articleId = req.params.articleId;
  db.all('SELECT * FROM comments WHERE article_id = ? ORDER BY id DESC', [articleId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: '댓글 조회 중 오류 발생', error: err.message });
    }
    res.status(200).json({ comments: rows });
  });
});

// [U] 댓글 수정 - 댓글 작성자만
router.put('/:commentId', authenticateToken, (req, res) => {
  const commentId = req.params.commentId;
  const { content } = req.body;
  const userId = req.user.userId;

  if (!content) {
    return res.status(400).json({ message: '수정할 댓글 내용을 입력하세요.' });
  }

  // 댓글 작성자 확인
  db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, comment) => {
    if (err) {
      return res.status(500).json({ message: '댓글 수정 중 오류 발생', error: err.message });
    }
    if (!comment) {
      return res.status(404).json({ message: '해당 댓글을 찾을 수 없습니다.' });
    }
    if (comment.user_id !== userId) {
      return res.status(403).json({ message: '본인이 작성한 댓글만 수정할 수 있습니다.' });
    }

    // 댓글 수정
    db.run('UPDATE comments SET content = ? WHERE id = ?', [content, commentId], function (err2) {
      if (err2) {
        return res.status(500).json({ message: '댓글 수정 중 오류 발생', error: err2.message });
      }
      res.status(200).json({ message: '댓글이 수정되었습니다.' });
    });
  });
});

// [D] 댓글 삭제 - 댓글 작성자만
router.delete('/:commentId', authenticateToken, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.userId;

  // 댓글 작성자 확인
  db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, comment) => {
    if (err) {
      return res.status(500).json({ message: '댓글 삭제 중 오류 발생', error: err.message });
    }
    if (!comment) {
      return res.status(404).json({ message: '해당 댓글을 찾을 수 없습니다.' });
    }
    if (comment.user_id !== userId) {
      return res.status(403).json({ message: '본인이 작성한 댓글만 삭제할 수 있습니다.' });
    }

    // 댓글 삭제
    db.run('DELETE FROM comments WHERE id = ?', [commentId], function (err2) {
      if (err2) {
        return res.status(500).json({ message: '댓글 삭제 중 오류 발생', error: err2.message });
      }
      res.status(200).json({ message: '댓글이 삭제되었습니다.' });
    });
  });
});

module.exports = router;
