const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticate(req, res, next) {
  if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decoded.userId;
    req.decoded = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({ message: 'Invalid token. Please provide a valid token.' });
    }
    res.status(500).json({ message: 'An error occurred while processing the token.' });
  }
}

function isAdmin(req, res, next) {
  if (req.decoded && req.decoded.role === 'admin') {
    return next();
  }

  res.status(403).json({ message: 'Forbidden. Admin access required.' });
}

function isUser(req, res, next) {
  if (req.decoded && req.decoded.role === 'user') {
    return next();
  }

  res.status(403).json({ message: 'Forbidden. User access required.' });
}

module.exports = { authenticate, isAdmin, isUser };
