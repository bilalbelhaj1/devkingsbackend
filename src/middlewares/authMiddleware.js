const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  console.log("cookies");
  console.log(req.cookies)
  const accessToken = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ message: 'Access token invalid or expired' });
  }
};

const authorization = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = { authenticate, authorization };
