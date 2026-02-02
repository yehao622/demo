import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database';
import { User, UserResponse, RegisterRequest, LoginRequest, AuthResponse } from '../models/user.model';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const RESET_CODE_EXPIRY_MINUTES = 5;
const RESET_CODE_RESEND_COOLDOWN_SECONDS = 60;

export class AuthService {
    // Convert database user to response format
    private static userToResponse(user: User): UserResponse {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name
        };
    }

    // Generate JWT token for use
    private static generateToken(user: User): string {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    // Register a new user
    static async register(data: RegisterRequest): Promise<AuthResponse> {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('Invalid email format');
        }

        // Validate password strength
        if (data.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND role = ?').get(data.email, data.role);

        if (existingUser) {
            throw new Error(`An account with this email already exists as a ${data.role}`);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Insert user
        const result = db.prepare(`
            INSERT INTO users (email, password_hash, role, first_name, last_name)
            VALUES (?, ?, ?, ?, ?)
        `).run(data.email, passwordHash, data.role, data.firstName, data.lastName);

        // Fetch created user
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;

        // Generate token
        const token = this.generateToken(user);

        return {
            token,
            user: this.userToResponse(user)
        };
    }

    // Login user
    static async login(data: LoginRequest & { role: 'patient' | 'donor' }): Promise<AuthResponse> {
        // Find user by email
        const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(data.email, data.role) as User;

        if (!user) {
            // Check if user exists with different role
            const userWithDifferentRole = db.prepare('SELECT role FROM users WHERE email = ?').get(data.email) as { role: 'patient' | 'donor' } | undefined;

            if (userWithDifferentRole) {
                const article = userWithDifferentRole.role === 'donor' ? 'a' : 'a';
                throw new Error(
                    `This email is registered as ${article} ${userWithDifferentRole.role}. Please login as a ${userWithDifferentRole.role}.`
                );
            }
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Generate token
        const token = this.generateToken(user);

        return {
            token,
            user: this.userToResponse(user)
        };
    }

    // Verify JWT token
    static verifyToken(token: string): { id: number; email: string; role: 'patient' | 'donor' } {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: 'patient' | 'donor' };
            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    // Get user by ID
    static getUserById(id: number): UserResponse | null {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
        return user ? this.userToResponse(user) : null;
    }

    // Generate password reset code
    static async generatePasswordResetCode(email: string, role: 'patient' | 'donor'): Promise<{ code: string; expiresAt: Date }> {
        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, role) as User;

        if (!user) {
            // Don't reveal if user exists for security
            throw new Error('If this email exists, a reset code has been sent');
        }

        // Check for recent reset code (cooldown)
        const recentCode = db.prepare(`
            SELECT * FROM password_reset_codes 
            WHERE user_id = ? 
            AND created_at > datetime('now', '-${RESET_CODE_RESEND_COOLDOWN_SECONDS} seconds')
            ORDER BY created_at DESC
            LIMIT 1
        `).get(user.id);

        if (recentCode) {
            throw new Error(`Please wait ${RESET_CODE_RESEND_COOLDOWN_SECONDS} seconds before requesting a new code`);
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + RESET_CODE_EXPIRY_MINUTES);

        // Store code
        db.prepare(`
            INSERT INTO password_reset_codes (user_id, code, expires_at)
            VALUES (?, ?, ?)
        `).run(user.id, code, expiresAt.toISOString());

        return { code, expiresAt };
    }

    // Verify password reset code
    static verifyPasswordResetCode(email: string, code: string, role: 'patient' | 'donor'): { valid: boolean; userId?: number } {
        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, role) as User;

        if (!user) {
            return { valid: false };
        }

        // Find valid code
        const resetCode = db.prepare(`
            SELECT * FROM password_reset_codes 
            WHERE user_id = ? 
            AND code = ? 
            AND used = 0
            AND expires_at > datetime('now')
            ORDER BY created_at DESC
            LIMIT 1
        `).get(user.id, code);

        if (!resetCode) {
            return { valid: false };
        }

        return { valid: true, userId: user.id };
    }

    // reset password with code
    static async resetPassword(email: string, code: string, newPassword: string, role: 'patient' | 'donor'): Promise<boolean> {
        // Verify code
        const verification = this.verifyPasswordResetCode(email, code, role);

        if (!verification.valid || !verification.userId) {
            throw new Error('Invalid or expired reset code');
        }

        // Validate new password
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password
        db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(passwordHash, verification.userId);

        // Mark all codes as used
        db.prepare('UPDATE password_reset_codes SET used = 1 WHERE user_id = ?')
            .run(verification.userId);

        return true;
    }
}