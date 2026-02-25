import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';

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