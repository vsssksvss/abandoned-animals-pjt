const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth_mid'); // 로그인 상태 확인 미들웨어
const router = express.Router();

// 댓글 가져오기 (게시물별)
router.get('/articles/:id/comments', (req, res) => {
  const articleId = req.params.id;

  db.all('SELECT c.id, c.content, c.created_at, u.email FROM comments c JOIN users u ON c.user_id = u.id WHERE c.article_id = ?', [articleId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: '댓글 조회 중 오류 발생', error: err.message });
    }
    res.status(200).json(rows);
  });
});

// 댓글 작성 (로그인 필수)
router.post('/articles/:id/comments', authenticateToken, (req, res) => {
  const articleId = req.params.id;
  const userId = req.user.userId; // 로그인한 사용자의 ID
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: '댓글 내용을 입력하세요.' });
  }

  db.run(
    'INSERT INTO comments (content, article_id, user_id) VALUES (?, ?, ?)',
    [content, articleId, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ message: '댓글 작성 중 오류 발생', error: err.message });
      }
      res.status(201).json({
        message: '댓글이 작성되었습니다.',
        commentId: this.lastID,
        content,
        articleId,
        userId,
      });
    }
  );
});

// 댓글 수정 (자신의 댓글만 수정 가능)
router.put('/articles/:id/comments/:commentId', authenticateToken, (req, res) => {
  const articleId = req.params.id;
  const commentId = req.params.commentId;
  const userId = req.user.userId; // 로그인한 사용자의 ID
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: '수정할 댓글 내용을 입력하세요.' });
  }

  // 댓글 작성자 확인
  db.get('SELECT user_id FROM comments WHERE id = ?', [commentId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: '댓글 수정 중 오류 발생', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (row.user_id !== userId) {
      return res.status(403).json({ message: '자신의 댓글만 수정할 수 있습니다.' });
    }

    // 댓글 내용 수정
    db.run(
      'UPDATE comments SET content = ? WHERE id = ?',
      [content, commentId],
      function (err) {
        if (err) {
          return res.status(500).json({ message: '댓글 수정 중 오류 발생', error: err.message });
        }
        res.status(200).json({ message: '댓글이 수정되었습니다.', commentId, content });
      }
    );
  });
});

// 댓글 삭제 (자신의 댓글만 삭제 가능)
router.delete('/articles/:id/comments/:commentId', authenticateToken, (req, res) => {
  const articleId = req.params.id;
  const commentId = req.params.commentId;
  const userId = req.user.userId;

  // 댓글 작성자 확인
  db.get('SELECT user_id FROM comments WHERE id = ?', [commentId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: '댓글 삭제 중 오류 발생', error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (row.user_id !== userId) {
      return res.status(403).json({ message: '자신의 댓글만 삭제할 수 있습니다.' });
    }

    // 댓글 삭제
    db.run('DELETE FROM comments WHERE id = ?', [commentId], function (err) {
      if (err) {
        return res.status(500).json({ message: '댓글 삭제 중 오류 발생', error: err.message });
      }
      res.status(200).json({ message: '댓글이 삭제되었습니다.' });
    });
  });
});

module.exports = router;
