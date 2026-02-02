import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { RegisterRequest, LoginRequest } from '../models/user.model';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const data: RegisterRequest = req.body;

        // Validate required fields
        if (!data.email || !data.password || !data.role || !data.firstName || !data.lastName) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        if (data.role !== 'patient' && data.role !== 'donor') {
            res.status(400).json({ error: 'Role must be either "patient" or "donor"' });
            return;
        }

        const result = await AuthService.register(data);
        res.status(201).json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        res.status(400).json({ error: message });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;

        // Validate required fields
        if (!email || !password || !role) {
            return res.status(400).json({
                error: 'Email, password, and role are required'
            });
        }

        // Validate role
        if (role !== 'patient' && role !== 'donor') {
            return res.status(400).json({
                error: 'Role must be either patient or donor'
            });
        }

        const result = await AuthService.login({ email, password, role });

        res.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({ error: message });
    }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const user = AuthService.getUserById(req.user.id);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

/**
 * POST /api/auth/forgot-password
 * Generate password reset code
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email, role } = req.body;

        if (!email || !role) {
            res.status(400).json({ error: 'Email and role are required' });
            return;
        }

        if (role !== 'patient' && role !== 'donor') {
            return res.status(400).json({ error: 'Role must be either patient or donor' });
        }

        const result = await AuthService.generatePasswordResetCode(email, role);

        // In development, return the code for testing
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            res.status(200).json({
                message: 'Password reset code sent',
                code: result.code,
                expiresAt: result.expiresAt
            });
        } else {
            // In production, don't return the code
            res.status(200).json({ message: 'Password reset code sent' });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate reset code';
        res.status(400).json({ error: message });
    }
});

/**
 * POST /api/auth/verify-code
 * Verify password reset code
 */
router.post('/verify-code', (req: Request, res: Response) => {
    try {
        const { email, code, role } = req.body;

        if (!email || !code || !role) {
            return res.status(400).json({ error: 'Email, code, and role are required' });
        }

        const result = AuthService.verifyPasswordResetCode(email, code, role);

        if (result.valid) {
            res.status(200).json({ valid: true, message: 'Code verified successfully' });
        } else {
            res.status(400).json({ valid: false, error: 'Invalid or expired code' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify code' });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password with verified code
 */
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { email, code, newPassword, role } = req.body;

        if (!email || !code || !newPassword || !role) {
            res.status(400).json({ error: 'Email, code, new password and role are required' });
        }

        await AuthService.resetPassword(email, code, newPassword, role);
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reset password';
        res.status(400).json({ error: message });
    }
});

export default router;
