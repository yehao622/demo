import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth.routes';
import db from '../src/database';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
    beforeEach(() => {
        db.prepare('DELETE FROM password_reset_codes').run();
        db.prepare('DELETE FROM users').run();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'routes-register@example.com',
                    password: 'password123',
                    role: 'patient',
                    firstName: 'John',
                    lastName: 'Doe'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe('routes-register@example.com');
        });

        it('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'incomplete@example.com'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'routes-login@example.com',
                    password: 'password123',
                    role: 'patient',
                    firstName: 'John',
                    lastName: 'Doe'
                });
        });

        it('should login successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'routes-login@example.com',
                    password: 'password123',
                    role: 'patient'  // ← ADDED role
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        it('should return 401 for wrong password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'routes-login@example.com',
                    password: 'wrongpassword',
                    role: 'patient'  // ← ADDED role
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        let token: string;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'routes-me@example.com',
                    password: 'password123',
                    role: 'donor',
                    firstName: 'Jane',
                    lastName: 'Smith'
                });

            token = response.body.token;
        });

        it('should return current user with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe('routes-me@example.com');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
        });
    });
});
