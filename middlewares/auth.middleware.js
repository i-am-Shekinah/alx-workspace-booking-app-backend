import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
  const accessToken= req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access denied. No valid token provided' });

  jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      const errMessage = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
      return res.status(403).json({ error: errMessage });
    }
    req.user = user;
    next();
  });
};