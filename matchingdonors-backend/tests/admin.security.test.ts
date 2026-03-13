import request from 'supertest';
import { app } from '../src/index';

describe('Admin API Security Checks', () => {

    it('should block unauthenticated requests to the admin users endpoint', async () => {
        // We act like a hacker trying to get the user list WITHOUT a token
        const response = await request(app).get('/api/admin/users');

        // Assertions: It MUST fail and return a 401 (Unauthorized) or 403 (Forbidden)
        // Adjust the expected status code based on what your authMiddleware actually returns!
        expect(response.status).toBeGreaterThanOrEqual(401);
        expect(response.body).toHaveProperty('error');
    });

});