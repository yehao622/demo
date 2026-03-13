import request from 'supertest';
import { app } from '../src/index';

describe('System Health Check API', () => {

    // This is the actual test case
    it('should return a 200 OK status and a timestamp', async () => {
        // Supertest acts like a fake browser/frontend making a request
        const response = await request(app).get('/health');

        // Assertions: These are the rules the response MUST pass
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('timestamp');
    });

});