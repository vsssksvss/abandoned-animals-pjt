// routes/animal.js (mock data 버전)

const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const router = express.Router();

// mock_data.json 경로
const MOCK_DATA_PATH = path.join(__dirname, '../mock_data.json');

// mock JSON에서 유기동물 데이터를 읽어와 DB에 저장
async function fetchAndSaveAnimals() {
  try {
    const data = JSON.parse(fs.readFileSync(MOCK_DATA_PATH, 'utf8'));
    const items = data.response.body.items.item;

    for (const item of items) {
      const { desertionNo, kindCd, sexCd, age, popfile, careNm } = item;
      await db.run(
        `INSERT OR IGNORE INTO animals (id, name, breed, age, gender, image_url, location)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [desertionNo, kindCd, kindCd, age, sexCd, popfile, careNm]
      );
    }
    console.log('[MOCK] 유기동물 데이터 저장 완료');
  } catch (err) {
    console.error('Mock 데이터 처리 중 오류:', err.message);
  }
}

// 전체 유기동물 리스트 조회
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM animals');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB 조회 실패' });
  }
});

// 수동 fetch → mock 데이터 기반 저장
router.get('/fetch', async (req, res) => {
  await fetchAndSaveAnimals();
  res.json({ message: '[MOCK] 유기동물 정보 업데이트 완료' });
});

module.exports = router;