import request from 'supertest';

import app from '../index.js';

const signupUser = async (userData) => {
  return request(app).post('/api/auth/signup').send(userData);
};

describe('User Signup', () => {
  test('Should create a new user successfully', async () => {
    const response = await signupUser({
      username: 'testUser',
      email: 'testUser@gmail.com',
      password: 'strongPassword123',
      firstName: 'Test',
      lastName: 'User',
      role: 'learner',
      preferences: {
        preferred_language: 'english',
        workspace: 'desk',
        notification: 'email',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'User created successfully');
    expect(response.body.user).toHaveProperty('id');
  });

  test('Should fail if username is already taken', async () => {
    await signupUser({
      username: 'existingUser',
      email: 'someemail@gmail.com',
      password: 'password123',
      firstName: 'Existing',
      lastName: 'User',
      role: 'employee',
    });

    const response = await signupUser({
      username: 'existingUser',
      email: 'newemail@gmail.com',
      password: 'password123',
      firstName: 'Existing',
      lastName: 'User',
      role: 'employee',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'username is already taken');
  });

  test('Should fail if email is already taken', async () => {
    await signupUser({
      username: 'John',
      email: 'sameemail@gmail.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
    });

    const response = await signupUser({
      username: 'Doe',
      email: 'sameemail@gmail.com',
      password: 'password123',
      firstName: 'Doe',
      lastName: 'John',
      role: 'admin',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'email is already taken');
  });
});
