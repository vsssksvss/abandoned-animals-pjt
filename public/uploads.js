const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();

// uploads 폴더가 없으면 자동 생성
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

// 단일 파일 업로드 처리 (input 이름은 "image")
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일 업로드 실패' });
  }
  // 업로드된 파일의 URL 생성 (예: /uploads/파일이름)
  const fileUrl = `/uploads/${req.file.filename}`;
  console.log("파일 업로드 성공, URL:", fileUrl);
  res.json({ url: fileUrl });
});

module.exports = router;
