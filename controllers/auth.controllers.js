import Joi from 'joi';

import {
  createUser,
  getUserByEmail,
} from '../models/user.model.js';
import {
  comparePasswords,
  generateToken,
  hashPassword,
} from '../utils/auth.util.js';

const toTitleCase = (str) => 
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const signupSchema = Joi.object({
  username: Joi.string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^\S+$/)
  .required()
  .messages({'string.pattern.base': 'Username cannot contain whitespaces'}),


  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string()
  .trim()
  .required()
  .custom((value) => toTitleCase(value), 'Title Case Conversion'),


  lastName: Joi.string()
  .trim()
  .required()
  .custom((value) => toTitleCase(value), 'Title Case Conversion'),


  role: Joi.string().valid('admin', 'learner', 'employee').trim().required(),

  preferences: Joi.object().optional(),
});


const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required()
})

export const signupUser = async (req, res) => {
  const { value: userData, error } = signupSchema.validate(req.body, { abortEarly: false, convert: true, stripUnknown: true });

  if (error) {
    return res.status(400).json({ errors: error.details.map(err => err.message) });
  }

  try {
    userData.password= await hashPassword(userData.password);

    const user = await createUser(userData);

    const token = generateToken(user.id, user.role);

    const { password: _, ...safeUser } = user;

    res.status(201).json({ message: 'User created successfully', user: safeUser, token });
  } catch (error) {
    if (error.code === 'P2002') {
      const targetField = error.meta?.target?.[0];
      return res.status(400).json({ error: `${targetField} is already taken` })
    }

    res.status(500).json({ error: 'Failed to create user. An unexpected error occurred' });
  }
};


export const loginUser = async (req, res) => {
  const { value: userCredentials, error } = loginSchema.validate(req.body, {
    abortEarly: false,
    convert: true,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({ errors: error.details.map(err => err.message)});
  }

  try {
    const { email, password } = userCredentials;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordAMatch = await comparePasswords(password, user.password);
    if(!isPasswordAMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password: _, ...safeUser } = user;

    const token = generateToken(user.id, user.role);

    res.status(200).json({ message: 'Login successful', user: safeUser, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}