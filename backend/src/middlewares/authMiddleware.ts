import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

interface AuthUser {
  id: string;
  role: 'user' | 'admin' | 'superadmin' | 'staff' | 'moderator';
  [key: string]: any;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Geçersiz token.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (
    req.user &&
    (
      req.user.role === 'admin' ||
      req.user.role === 'superadmin' ||
      req.user.role === 'staff' ||
      req.user.role === 'moderator'
    )
  ) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required.' });
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  return res.status(403).json({ message: 'Superadmin access required.' });
};

export default authMiddleware; 