function authenticateAdmin(req, res, next) {
    // 이미 인증 미들웨어로 req.user에 사용자 정보를 저장했다고 가정
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
  }
  
  module.exports = { authenticateAdmin };
  