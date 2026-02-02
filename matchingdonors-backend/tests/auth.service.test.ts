import { AuthService } from '../src/services/auth.service';
import db from '../src/database';

describe('AuthService', () => {
    // Clear data before each test
    beforeEach(() => {
        db.prepare('DELETE FROM password_reset_codes').run();
        db.prepare('DELETE FROM users').run();
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

        it('should throw error for duplicate email with same role', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                role: 'patient' as const,
                firstName: 'John',
                lastName: 'Doe'
            };

            await AuthService.register(userData);
            await expect(AuthService.register(userData)).rejects.toThrow('An account with this email already exists as a patient');
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            // Clear first to avoid conflicts
            db.prepare('DELETE FROM users').run();

            // Create test user
            await AuthService.register({
                email: 'login-test@example.com',
                password: 'password123',
                role: 'patient',
                firstName: 'John',
                lastName: 'Doe'
            });
        });

        it('should successfully login with correct credentials', async () => {
            const result = await AuthService.login({
                email: 'login-test@example.com',
                password: 'password123',
                role: 'patient'
            });

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe('login-test@example.com');
        });

        it('should throw error for invalid email', async () => {
            await expect(AuthService.login({
                email: 'wrong@example.com',
                password: 'password123',
                role: 'patient'
            })).rejects.toThrow('Invalid email or password');
        });

        it('should throw error for invalid password', async () => {
            await expect(AuthService.login({
                email: 'login-test@example.com',
                password: 'wrongpassword',
                role: 'patient'
            })).rejects.toThrow('Invalid email or password');
        });
    });

    describe('Role-Based Login Validation', () => {
        it('should prevent login with mismatched role', async () => {
            // Register as donor
            await AuthService.register({
                email: 'donor@test.com',
                password: 'password123',
                role: 'donor',
                firstName: 'John',
                lastName: 'Donor'
            });

            // Try to login as patient
            await expect(
                AuthService.login({
                    email: 'donor@test.com',
                    password: 'password123',
                    role: 'patient'
                })
            ).rejects.toThrow('This email is registered as a donor');
        });

        it('should allow same email for different roles', async () => {
            const email = 'both@test.com';

            // Register as patient
            const patient = await AuthService.register({
                email,
                password: 'password123',
                role: 'patient',
                firstName: 'Jane',
                lastName: 'Patient'
            });

            // Register as donor with same email
            const donor = await AuthService.register({
                email,
                password: 'password456',
                role: 'donor',
                firstName: 'Jane',
                lastName: 'Donor'
            });

            expect(patient.user.role).toBe('patient');
            expect(donor.user.role).toBe('donor');
            expect(patient.user.id).not.toBe(donor.user.id);
        });

        it('should successfully login to correct role account', async () => {
            const email = 'multi-role@test.com';

            // Register same email for both roles
            await AuthService.register({
                email,
                password: 'patient-pass-123',
                role: 'patient',
                firstName: 'Multi',
                lastName: 'Role'
            });

            await AuthService.register({
                email,
                password: 'donor-pass-456',
                role: 'donor',
                firstName: 'Multi',
                lastName: 'Role'
            });

            // Login as patient
            const patientLogin = await AuthService.login({
                email,
                password: 'patient-pass-123',
                role: 'patient'
            });
            expect(patientLogin.user.role).toBe('patient');

            // Login as donor
            const donorLogin = await AuthService.login({
                email,
                password: 'donor-pass-456',
                role: 'donor'
            });
            expect(donorLogin.user.role).toBe('donor');
        });
    });

    describe('verifyToken', () => {
        it('should verify valid token', async () => {
            db.prepare('DELETE FROM users').run();

            const registerResult = await AuthService.register({
                email: 'token-test@example.com',
                password: 'password123',
                role: 'donor',
                firstName: 'Jane',
                lastName: 'Smith'
            });

            const decoded = AuthService.verifyToken(registerResult.token);

            expect(decoded.email).toBe('token-test@example.com');
            expect(decoded.role).toBe('donor');
        });

        it('should throw error for invalid token', () => {
            expect(() => AuthService.verifyToken('invalid-token')).toThrow('Invalid or expired token');
        });
    });

    describe('password reset with role parameter', () => {
        beforeEach(async () => {
            db.prepare('DELETE FROM password_reset_codes').run();
            db.prepare('DELETE FROM users').run();

            // Register patient account
            await AuthService.register({
                email: 'reset-test@example.com',
                password: 'password123',
                role: 'patient',
                firstName: 'John',
                lastName: 'Doe'
            });

            // Register donor account with same email
            await AuthService.register({
                email: 'reset-test@example.com',
                password: 'donor-pass-456',
                role: 'donor',
                firstName: 'John',
                lastName: 'Doe'
            });
        });

        it('should generate password reset code for specific role', async () => {
            const result = await AuthService.generatePasswordResetCode('reset-test@example.com', 'patient');
            expect(result.code).toHaveLength(6);
            expect(result.code).toMatch(/^\d{6}$/);
            expect(result.expiresAt).toBeInstanceOf(Date);
        });

        it('should verify valid reset code for correct role', async () => {
            const { code } = await AuthService.generatePasswordResetCode('reset-test@example.com', 'patient');
            const result = AuthService.verifyPasswordResetCode('reset-test@example.com', code, 'patient');
            
            expect(result.valid).toBe(true);
            expect(result.userId).toBeDefined();
        });

        it('should reject reset code when used with wrong role', async () => {
            // Generate code for patient
            const { code } = await AuthService.generatePasswordResetCode('reset-test@example.com', 'patient');
            
            // Try to verify with donor role
            const result = AuthService.verifyPasswordResetCode('reset-test@example.com', code, 'donor');
            
            expect(result.valid).toBe(false);
        });

        it('should reset password only for specified role', async () => {
            // Get reset code for patient
            const { code } = await AuthService.generatePasswordResetCode('reset-test@example.com', 'patient');
            
            // Reset patient password
            await AuthService.resetPassword('reset-test@example.com', code, 'new-patient-pass', 'patient');
            
            // Patient can login with new password
            const patientLogin = await AuthService.login({
                email: 'reset-test@example.com',
                password: 'new-patient-pass',
                role: 'patient'
            });
            expect(patientLogin).toHaveProperty('token');
            
            // Donor still uses old password
            const donorLogin = await AuthService.login({
                email: 'reset-test@example.com',
                password: 'donor-pass-456',
                role: 'donor'
            });
            expect(donorLogin).toHaveProperty('token');
        });

        it('should prevent password reset for non-existent role', async () => {
            // User only registered as patient and donor
            await expect(
                AuthService.generatePasswordResetCode('only-patient@example.com', 'donor')
            ).rejects.toThrow();
        });

        it('should reject invalid reset code', () => {
            const result = AuthService.verifyPasswordResetCode('reset-test@example.com', '999999', 'patient');
            expect(result.valid).toBe(false);
        });
    });
});
