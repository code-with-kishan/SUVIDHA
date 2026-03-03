import jwt from 'jsonwebtoken';

export const verifyJwt = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
