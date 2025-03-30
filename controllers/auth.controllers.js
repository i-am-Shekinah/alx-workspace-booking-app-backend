import Joi from 'joi';

import { createUser } from '../models/user.model.js';
import {
  generateToken,
  hashPassword,
} from '../utils/auth.util.js';

const signupSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('admin', 'learner', 'employee').trim().required(),
  preferences: Joi.object().optional(),
});


export const signupUser = async (req, res) => {
  const { error } = signupSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ errors: error.details.map(err => err.message) });
  }

  try {
    const { username, email, password, firstName, lastName, role, preferences } = req.body;

    const hashedPassword = await hashPassword(password);

    const user = await createUser({ username, email, password: hashedPassword, firstName, lastName, role, preferences });

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