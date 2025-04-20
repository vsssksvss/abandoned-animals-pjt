const express = require('express');
const axios = require('axios');
const { getPetfinderToken } = require('../petfinderAuth');
const router = express.Router();

// GET /petfinder/animals: Petfinder API를 통해 동물 데이터를 조회
router.get('/animals', async (req, res) => {
  try {
    const token = await getPetfinderToken();
    const apiUrl = 'https://api.petfinder.com/v2/animals';
    const params = {
      type: req.query.type || 'dog',
      location: req.query.location || '90210',
      page: req.query.page || 3,
      limit: req.query.limit || 30
    };
    const response = await axios.get(apiUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      params
    });
    res.json(response.data);
  } catch (error) {
    console.error('Petfinder API 요청 실패:', error.response?.data || error.message);
    res.status(500).json({ error: 'Petfinder API 요청 실패' });
  }
});

router.put('/:id', async (req, res) => {
  const animalId = req.params.id;
  const { name, breed, age, gender, image_url, location } = req.body;
  
  // 기본적인 유효성 검사 (예: name 필수)
  if (!name) {
    return res.status(400).json({ message: '동물 이름은 필수 항목입니다.' });
  }

  try {
    await db.run(
      `UPDATE animals 
       SET name = ?, breed = ?, age = ?, gender = ?, image_url = ?, location = ?
       WHERE id = ?`,
      [name, breed, age, gender, image_url, location, animalId]
    );
    res.status(200).json({ message: '동물 정보가 수정되었습니다.' });
  } catch (err) {
    console.error('동물 정보 수정 오류:', err);
    res.status(500).json({ message: '동물 정보 수정 중 오류 발생', error: err.message });
  }
});

module.exports = router;
