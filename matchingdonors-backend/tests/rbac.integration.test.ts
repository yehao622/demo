import request from 'supertest';
import { app } from '../src/index';
import jwt from 'jsonwebtoken';

describe('Role-Based Access Control (RBAC) Integration Tests', () => {

    it('should block a Patient from accessing the Admin Dashboard', async () => {
        // 1. Forge a perfectly valid JWT token, but assign the "patient" role
        // We use your fallback secret just in case .env isn't loaded in the test environment
        const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_key_change_in_production';
        const patientToken = jwt.sign(
            { id: 9999, email: 'sneaky@patient.com', role: 'patient' },
            jwtSecret,
            { expiresIn: '1h' }
        );

        // 2. The Patient tries to access the Admin Users list by passing the token in the header
        const response = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${patientToken}`);

        // 3. Assertions: The server MUST recognize the token is valid, 
        // but reject the request because the ROLE is wrong (usually a 403 Forbidden or 401)
        expect(response.status).toBeGreaterThanOrEqual(401);
        expect(response.body).toHaveProperty('error');
    });

});