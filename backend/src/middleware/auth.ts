// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            auth?: { userId: string; role?: string };
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_change_in_prod';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
        req.auth = { userId: decoded.userId, role: decoded.role };
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: admin role required' });
        }
        req.auth = { userId: decoded.userId, role: decoded.role };
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};