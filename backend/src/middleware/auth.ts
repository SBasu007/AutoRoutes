// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

declare global {
    namespace Express {
        interface Request {
            auth?: { userId: string };
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token' });

        const claims = await clerkClient.verifyToken(token);
        req.auth = { userId: claims.sub };
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};