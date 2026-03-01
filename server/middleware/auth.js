import { verifyJwt } from '../utils/jwt.js';

export const authGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: token missing' });
  }

  try {
    const payload = verifyJwt(token);
    req.user = payload;
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Unauthorized: invalid token' });
  }
};

export const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
