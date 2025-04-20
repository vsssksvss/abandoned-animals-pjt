const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();

// public/uploads 폴더가 없으면 생성
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('uploads 폴더가 생성되었습니다:', uploadDir);
}

// Multer 저장소 설정
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 단일 파일 업로드 (input name="image")
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일 업로드 실패' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  console.log("파일 업로드 성공, URL:", fileUrl);
  res.json({ url: fileUrl });
});

module.exports = router;
