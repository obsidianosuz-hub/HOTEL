const jwt = require('jsonwebtoken');

const staffAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.roleId) {
      return res.status(403).json({ error: 'Forbidden: Invalid staff token' });
    }
    req.user = decoded; // { userId, roleId, roleName, ... }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
};

module.exports = staffAuthMiddleware;
