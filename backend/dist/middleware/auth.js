import { clerkClient } from '@clerk/clerk-sdk-node';
export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).json({ error: 'No token' });
        const claims = await clerkClient.verifyToken(token);
        req.auth = { userId: claims.sub };
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
