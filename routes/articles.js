const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth_mid'); // JWT 인증 미들웨어
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth'); // 관리자 인증 미들웨어

// ========= 어드민 전용 라우트 =========
// 관리자(admin)는 모든 게시물을 삭제할 수 있음
router.delete('/admin/:id', authenticateToken, authenticateAdmin, (req, res) => {
  const articleId = req.params.id;
  db.get('SELECT * FROM articles WHERE id = ?', [articleId], (err, article) => {
    if (err) return res.status(500).json({ message: '게시글 삭제 중 오류 발생', error: err.message });
    if (!article) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    
    db.run('DELETE FROM articles WHERE id = ?', [articleId], function(err) {
      if (err) return res.status(500).json({ message: '게시글 삭제 중 오류 발생', error: err.message });
      res.status(200).json({ message: '게시글이 삭제되었습니다.' });
    });
  });
});

// ========= 일반 사용자 / 관리자 공용 라우트 =========

// 게시글 작성 (제목, 내용, 카테고리, 이미지 URL 등을 포함)
// 클라이언트에서 title, content, category, image_url 등을 보냅니다.
router.post('/', authenticateToken, (req, res) => {
  const { title, content, category, image_url } = req.body;
  const userId = req.user.id; // JWT payload의 "id"

  if (!title || !content) {
    return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
  }
  
  // 카테고리가 없으면 기본값 '전체' 사용
  const articleCategory = category ? category : '전체';

  db.run(
    'INSERT INTO articles (title, content, category, image_url, user_id) VALUES (?, ?, ?, ?, ?)',
    [title, content, articleCategory, image_url, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ message: '게시글 작성 중 오류 발생', error: err.message });
      }
      res.status(201).json({ message: '게시글이 작성되었습니다!', articleId: this.lastID });
    }
  );
});

// 게시글 조회 (상세 조회) — GET /articles/:id
router.get('/:id', (req, res) => {
  const articleId = req.params.id;
  const sql = `
    SELECT articles.*, users.email AS user_email, datetime(articles.created_at, "localtime") AS created_at 
    FROM articles 
    LEFT JOIN users ON articles.user_id = users.id 
    WHERE articles.id = ?
  `;
  db.get(sql, [articleId], (err, article) => {
    if (err) {
      return res.status(500).json({ message: '게시글 불러오기 중 오류 발생', error: err.message });
    }
    if (!article) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    res.status(200).json(article);
  });
});

// 게시글 조회 (전체 목록 및 카테고리별 필터)
// 예: GET /articles?category=질문
router.get('/', (req, res) => {
  const category = req.query.category;
  let sql = `
    SELECT articles.*, users.email AS user_email, datetime(articles.created_at, 'localtime') AS created_at 
    FROM articles 
    LEFT JOIN users ON articles.user_id = users.id
  `;
  const params = [];
  if (category && category !== '전체') {
    sql += ' WHERE articles.category = ?';
    params.push(category);
  }
  sql += ' ORDER BY articles.id DESC';
  
  db.all(sql, params, (err, articles) => {
    if (err) {
      return res.status(500).json({ message: '게시글 불러오는 중 오류 발생', error: err.message });
    }
    res.status(200).json({ articles });
  });
});

// 게시글 수정 (작성자 혹은 관리자만 가능)
// 관리자는 모든 게시글을 수정할 수 있음
router.put('/:id', authenticateToken, (req, res) => {
  const { title, content, category, image_url } = req.body;
  const articleId = req.params.id;
  const userId = req.user.id;
  const currentRole = req.user.role; // 예: 'admin' 또는 'user'

  if (!title || !content) {
    return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
  }
  
  db.get('SELECT * FROM articles WHERE id = ?', [articleId], (err, article) => {
    if (err) {
      return res.status(500).json({ message: '게시글 수정 중 오류 발생', error: err.message });
    }
    if (!article) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    // 작성자와 일치하지 않으면, 관리자(admin)가 아니라면 수정 불가
    if (article.user_id !== userId && currentRole !== 'admin') {
      return res.status(403).json({ message: '본인이 작성한 게시글만 수정할 수 있습니다.' });
    }
    
    db.run(
      'UPDATE articles SET title = ?, content = ?, category = ?, image_url = ? WHERE id = ?',
      [title, content, category || article.category, image_url, articleId],
      function (err) {
        if (err) {
          return res.status(500).json({ message: '게시글 수정 중 오류 발생', error: err.message });
        }
        res.status(200).json({ message: '게시글이 수정되었습니다.' });
      }
    );
  });
});

// 게시글 삭제 (작성자 또는 관리자만 가능)
// 여기서는 클라이언트용 DELETE 라우트를 제공합니다.
router.delete('/:id', authenticateToken, (req, res) => {
  const articleId = req.params.id;
  const userId = req.user.id;
  const currentRole = req.user.role;

  db.get('SELECT * FROM articles WHERE id = ?', [articleId], (err, article) => {
    if (err) {
      return res.status(500).json({ message: '게시글 삭제 중 오류 발생', error: err.message });
    }
    if (!article) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    // 작성자와 일치하거나, 관리자인 경우 삭제 가능
    if (article.user_id !== userId && currentRole !== 'admin') {
      return res.status(403).json({ message: '본인이 작성한 게시글만 삭제할 수 있습니다.' });
    }
    
    db.run('DELETE FROM articles WHERE id = ?', [articleId], function (err) {
      if (err) {
        return res.status(500).json({ message: '게시글 삭제 중 오류 발생', error: err.message });
      }
      res.status(200).json({ message: '게시글이 삭제되었습니다.' });
    });
  });
});

module.exports = router;
