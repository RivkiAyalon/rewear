const jwt = require('jsonwebtoken');

// Verifies the token and attaches the user to the request
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);  // { id, role }
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
}

// Must run after auth
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You do not have permission for this action' });
  }
  next();
}

module.exports = { auth, isAdmin };