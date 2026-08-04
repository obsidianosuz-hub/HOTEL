const jwt = require('jsonwebtoken');

const guestAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_GUEST_SECRET);
    if (!decoded.guestId) {
      return res.status(403).json({ error: 'Forbidden: Invalid guest token' });
    }
    req.guest = decoded; // { guestId, ... }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
};

module.exports = guestAuthMiddleware;
