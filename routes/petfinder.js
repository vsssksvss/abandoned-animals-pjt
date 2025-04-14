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
      page: req.query.page || 1,
      limit: req.query.limit || 10
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

module.exports = router;
