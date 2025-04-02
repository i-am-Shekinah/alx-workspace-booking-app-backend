import request from 'supertest';

import app from '../index.js';

const signupUser = async (userData) => request(app).post('/api/auth/signup').send(userData);
const loginUser = async (userCredentials) => request(app).post('/api/auth/login').send(userCredentials);

describe('User Signup', () => {
  test('Should create a new user successfully', async () => {
    const response = await signupUser({
      username: 'Johnny',
      email: '  joHnny@gmail.com',
      password: 'john123',
      firstName: 'John',
      lastName: 'Doe',
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
    expect(response.body.user.email).toBe('johnny@gmail.com');
  });


  test('Should fail if username is already taken', async () => {
    await signupUser({
      username: 'Rachael',
      email: 'rachael@gmail.com',
      password: 'rachael123',
      firstName: 'Rachael',
      lastName: 'Stone',
      role: 'employee',
    });

    const response = await signupUser({
      username: 'Rachael',
      email: 'arachael@gmail.com',
      password: 'rachael123',
      firstName: 'Rachael',
      lastName: 'Stone',
      role: 'employee',
    });

    expect(response.statusCode).toBe(400)
    expect(response.body.error).toBe('Username is already taken');
  });


  test('Should fail if email is already taken', async () => {
    await signupUser({
      username: 'Daniel',
      email: 'daniel@gmail.com',
      password: 'daniel123',
      firstName: 'Daniel',
      lastName: 'Rock',
      role: 'employee',
    });

    const response = await signupUser({
      username: 'DannyBoy',
      email: 'daniel@gmail.com',
      password: 'daniel123',
      firstName: 'Daniel',
      lastName: 'Rock',
      role: 'employee',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Email is already taken');
  });


  test('Should fail if username contains whitespace', async () => {
    const response = await signupUser({
      username: 'Mike Ross',
      email: 'mike@gmail.com',
      password: 'mike123',
      firstName: 'Mike',
      lastName: 'Ross',
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


describe('User login', () => {
  test('Should log in the user successfully', async () => {
    const response = await loginUser({
      email: 'johnny@gmail.com',
      password: 'john123'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.firstName).toBe('John');
  });


  test('Should fail if email is invalid', async () => {
    const response = await loginUser({
      email: 'chimera@gmail.com',
      password: 'chimera123'
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Invalid email or password');
  });


  test('Should fail if password is invalid', async () => {
    const response = await loginUser({
      email: 'johnny@gmail.com',
      password: 'password123'
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Invalid email or password');
  });


  test('Should fail if email is missing', async () => {
    const response = await loginUser({
      password: 'password123'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errors[0]).toBe('\"email\" is required')
  });


  test('Should fail if password is missing', async () => {
    const response = await loginUser({
      email: 'johnny@gmail.com'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errors[0]).toBe('\"password\" is required');
  });
});