import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import db from '../database/init';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
    id: number;
    email: string;
    role: 'patient' | 'donor' | 'sponsor';
    firstName: string;
    lastName: string;
}

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Need authentication token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Middleware to check user role
export const authorizeRole = (...allowedRoles: Array<'patient' | 'donor' | 'sponsor'>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            res.status(401).json({ error: 'Insufficient permissions for this role' });
            return;
        }
        next();
    };
};

/**
 * Middleware to ensure the authenticated user has Admin privileges.
 * IMPORTANT: This must be called AFTER your standard authentication middleware!
 */
export const verifyAdmin = (req: any, res: any, next: any) => {
    try {
        // (Assuming your standard auth middleware attaches it to req.user.id)
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized: User not authenticated.' });
        }

        // 2. Check the database for the is_admin flag
        const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId) as { is_admin: number } | undefined;

        // 3. Reject if they aren't an admin
        if (!user || user.is_admin !== 1) {
            return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
        }

        // 4. Success! Let them through the hidden door
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify admin status.' });
    }
};