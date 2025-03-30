import request from 'supertest';

import app from '../index.js';

const signupUser = async (userData) => request(app).post('/api/auth/signup').send(userData);

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
    expect(response.body.message).toBe('User created successfully');
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
      email: 'anotheremail@gmail.com',
      password: 'password123',
      firstName: 'Existing',
      lastName: 'User',
      role: 'employee',
    });

    expect(response.statusCode).toBe(400)
    expect(response.body.error).toBe('username is already taken');
  });


  test('Should fail if email is already taken', async () => {
    await signupUser({
      username: 'newUser',
      email: 'existingemail@gmail.com',
      password: 'password123',
      firstName: 'Existing',
      lastName: 'User',
      role: 'employee',
    });

    const response = await signupUser({
      username: 'newUser',
      email: 'existingemail@gmail.com',
      password: 'password123',
      firstName: 'Existing',
      lastName: 'User',
      role: 'employee',
    });

    expect(response.statusCode).toBe(400)
    expect(response.body.error).toBe('username is already taken');
  });


  test('Should fail if username contains whitespace', async () => {
    const response = await signupUser({
      username: 'user 2',
      email: 'user2@gmail.com',
      password: 'user2password',
      firstName: 'John',
      lastName: 'Jonathan',
      role: 'admin',
      preferences: {
        workspace: 'desk',
        preferred_language: 'english',
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errors[0]).toBe('Username cannot contain whitespaces');
  });
});