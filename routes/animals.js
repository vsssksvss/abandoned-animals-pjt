// routes/animals.js
const express = require('express');
const fetch = require('node-fetch'); // fetch를 사용하여 API 호출
const xml2js = require('xml2js'); // xml2js 모듈을 사용하여 XML을 JSON으로 변환

const router = express.Router();

// 유기동물 API 연결
router.get('/animals', async (req, res) => {
  try {
    const response = await fetch(`${process.env.API_URL}/animals?_type=json&serviceKey=${process.env.API_KEY}`, {
      method: 'GET',
    });

    const text = await response.text();  // 응답을 텍스트로 받기
    let data;

    // 응답이 XML일 경우 XML을 JSON으로 변환
    if (text.startsWith('<?xml')) {
      xml2js.parseString(text, (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'XML 변환 중 오류 발생', error: err.message });
        }
        data = result;
        return res.status(200).json(data);
      });
    } else {
      // JSON인 경우 바로 처리
      data = JSON.parse(text);
      return res.status(200).json(data);
    }
  } catch (error) {
    res.status(500).json({ message: 'API 호출 중 오류 발생', error: error.message });
  }
});

module.exports = router;
