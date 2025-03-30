import Joi from 'joi';

import { createUser } from '../models/user.model.js';
import {
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


  email: Joi.string().email().trim().required(),
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