const request = require('supertest');
const app = require('../src/app');

describe('API Health Check', () => {
    it('should return 200 OK for /api/health', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });
});

describe('Auth Routes', () => {
    it('should reject login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'invalid@test.com', password: 'wrong' });
        expect(res.statusCode).toBe(401);
    });
});
