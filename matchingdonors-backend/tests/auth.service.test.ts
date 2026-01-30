import { AuthService } from '../src/services/auth.service';
import db from '../src/database';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
    beforeEach(() => {
        // Clear test data
        db.prepare('DELETE FROM password_reset_codes').run();
        db.prepare('DELETE FROM users').run();
    });

    afterAll(() => {
        db.close();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                role: 'patient' as const,
                firstName: 'John',
                lastName: 'Doe'
            };

            const result = await AuthService.register(userData);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe(userData.email);
            expect(result.user.role).toBe(userData.role);
            expect(result.user.firstName).toBe(userData.firstName);
            expect(result.user.lastName).toBe(userData.lastName);
        });

        it('should throw error for invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'password123',
                role: 'patient' as const,
                firstName: 'John',
                lastName: 'Doe'
            };

            await expect(AuthService.register(userData)).rejects.toThrow('Invalid email format');
        });

        it('should throw error for short password', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'short',
                role: 'patient' as const,
                firstName: 'John',
                lastName: 'Doe'
            };

            await expect(AuthService.register(userData)).rejects.toThrow('Password must be at least 8 characters long');
        });

        it('should throw error for duplicate email', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                role: 'patient' as const,
                firstName: 'John',
                lastName: 'Doe'
            };

            await AuthService.register(userData);
            await expect(AuthService.register(userData)).rejects.toThrow('User with this email already exists');
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            // Create test user
            await AuthService.register({
                email: 'test@example.com',
                password: 'password123',
                role: 'patient',
                firstName: 'John',
                lastName: 'Doe'
            });
        });

        it('should successfully login with correct credentials', async () => {
            const result = await AuthService.login({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe('test@example.com');
        });

        it('should throw error for invalid email', async () => {
            await expect(AuthService.login({
                email: 'wrong@example.com',
                password: 'password123'
            })).rejects.toThrow('Invalid email or password');
        });

        it('should throw error for invalid password', async () => {
            await expect(AuthService.login({
                email: 'test@example.com',
                password: 'wrongpassword'
            })).rejects.toThrow('Invalid email or password');
        });
    });

    describe('verifyToken', () => {
        it('should verify valid token', async () => {
            const registerResult = await AuthService.register({
                email: 'test@example.com',
                password: 'password123',
                role: 'donor',
                firstName: 'Jane',
                lastName: 'Smith'
            });

            const decoded = AuthService.verifyToken(registerResult.token);

            expect(decoded.email).toBe('test@example.com');
            expect(decoded.role).toBe('donor');
        });

        it('should throw error for invalid token', () => {
            expect(() => AuthService.verifyToken('invalid-token')).toThrow('Invalid or expired token');
        });
    });

    describe('password reset', () => {
        beforeEach(async () => {
            await AuthService.register({
                email: 'test@example.com',
                password: 'password123',
                role: 'patient',
                firstName: 'John',
                lastName: 'Doe'
            });
        });

        it('should generate password reset code', async () => {
            const result = await AuthService.generatePasswordResetCode('test@example.com');

            expect(result.code).toHaveLength(6);
            expect(result.code).toMatch(/^\d{6}$/);
            expect(result.expiresAt).toBeInstanceOf(Date);
        });

        it('should verify valid reset code', async () => {
            const { code } = await AuthService.generatePasswordResetCode('test@example.com');
            const result = AuthService.verifyPasswordResetCode('test@example.com', code);

            expect(result.valid).toBe(true);
            expect(result.userId).toBeDefined();
        });

        it('should reject invalid reset code', () => {
            const result = AuthService.verifyPasswordResetCode('test@example.com', '999999');

            expect(result.valid).toBe(false);
        });

        it('should successfully reset password', async () => {
            const { code } = await AuthService.generatePasswordResetCode('test@example.com');
            await AuthService.resetPassword('test@example.com', code, 'newpassword123');

            // Should be able to login with new password
            const loginResult = await AuthService.login({
                email: 'test@example.com',
                password: 'newpassword123'
            });

            expect(loginResult).toHaveProperty('token');
        });
    });
});
