import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
    id: number;
    email: string;
    role: 'patient' | 'donor';
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

// export interface AuthRequest extends Request {
//     user?: {
//         id: number;
//         email: string;
//         role: 'patient' | 'donor';
//     };
// }

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Middleware to verify JWT token
// export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
//     try {
//         const authHeader = req.headers.authorization;

//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             res.status(401).json({ error: 'No token provided' });
//             return;
//         }

//         const token = authHeader.substring(7); // Remove 'Bearer ' prefix
//         const decoded = AuthService.verifyToken(token);

//         req.user = decoded;
//         next();
//     } catch (error) {
//         res.status(401).json({ error: 'Invalid or expired token' });
//     }
// };

// Middleware to check user role
export const authorizeRole = (...allowedRoles: Array<'patient' | 'donor'>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
};