require('dotenv').config();
const axios = require('axios');

async function getPetfinderToken() {
  const clientId = process.env.PETFINDER_CLIENT_ID;
  const clientSecret = process.env.PETFINDER_CLIENT_SECRET;
  const url = 'https://api.petfinder.com/v2/oauth2/token';

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });

  try {
    const response = await axios.post(url, params);
    console.log('Petfinder Access Token 응답:', response.data);
    return response.data.access_token;
  } catch (error) {
    console.error('Petfinder 토큰 발급 실패:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { getPetfinderToken };
