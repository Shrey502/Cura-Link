// middleware/authenticateToken.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-key-for-the-hackathon';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = userPayload;
    next();
  });
};

module.exports = authenticateToken;