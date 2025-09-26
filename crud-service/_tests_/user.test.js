// crud-service/__tests__/user.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user');

let mongoServer;
const testUser = {
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    phone: '1234567890'
};

// Setup in-memory MongoDB before tests run
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

// Clear test database after each test
afterEach(async () => {
    await User.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('User API', () => {
    // Test GET /users
    describe('GET /users', () => {
        it('should return empty array when no users exist', async () => {
            const res = await request(app).get('/users');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([]);
        });

        it('should return all users', async () => {
            // Create test user
            await User.create(testUser);
            
            const res = await request(app).get('/users');
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe(testUser.name);
        });
    });

    // Test POST /users
    describe('POST /users', () => {
        it('should create a new user', async () => {
            const res = await request(app)
                .post('/users')
                .send(testUser);
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.name).toBe(testUser.name);
            expect(res.body.username).toBe(testUser.username);
            
            // Verify user was saved to database
            const savedUser = await User.findOne({ email: testUser.email });
            expect(savedUser).not.toBeNull();
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/users')
                .send({ name: 'Incomplete User' });
            
            expect(res.statusCode).toEqual(400);
        });
    });

    // Test GET /users/:id
    describe('GET /users/:id', () => {
        it('should return a user by id', async () => {
            const newUser = await User.create(testUser);
            
            const res = await request(app)
                .get(`/users/${newUser._id}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toBe(testUser.name);
        });

        it('should return 404 if user not found', async () => {
            const res = await request(app)
                .get('/users/507f1f77bcf86cd799439011'); // Random ObjectId
            
            expect(res.statusCode).toEqual(404);
        });
    });

    // Test PUT /users/:id
    describe('PUT /users/:id', () => {
        it('should update a user', async () => {
            const newUser = await User.create(testUser);
            const updatedData = { name: 'Updated Name' };
            
            const res = await request(app)
                .put(`/users/${newUser._id}`)
                .send(updatedData);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toBe(updatedData.name);
            
            // Verify update in database
            const updatedUser = await User.findById(newUser._id);
            expect(updatedUser.name).toBe(updatedData.name);
        });
    });

    // Test DELETE /users/:id
    describe('DELETE /users/:id', () => {
        it('should delete a user', async () => {
            const newUser = await User.create(testUser);
            
            const res = await request(app)
                .delete(`/users/${newUser._id}`);
            
            expect(res.statusCode).toEqual(200);
            
            // Verify user was deleted
            const deletedUser = await User.findById(newUser._id);
            expect(deletedUser).toBeNull();
        });
    });
});