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
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const data: LoginRequest = req.body;

        // Validate required fields
        if (!data.email || !data.password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const result = await AuthService.login(data);
        res.status(200).json(result);
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
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const result = await AuthService.generatePasswordResetCode(email);

        // In production, send code via email
        // For demo, return the code (REMOVE IN PRODUCTION)
        res.status(200).json({
            message: 'Reset code sent successfully',
            code: result.code, // REMOVE THIS IN PRODUCTION
            expiresAt: result.expiresAt
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate reset code';
        res.status(400).json({ error: message });
    }
});

/**
 * POST /api/auth/verify-code
 * Verify password reset code
 */
router.post('/verify-code', (req: Request, res: Response): void => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            res.status(400).json({ error: 'Email and code are required' });
            return;
        }

        const result = AuthService.verifyPasswordResetCode(email, code);

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
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            res.status(400).json({ error: 'Email, code, and new password are required' });
            return;
        }

        await AuthService.resetPassword(email, code, newPassword);
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reset password';
        res.status(400).json({ error: message });
    }
});

export default router;
