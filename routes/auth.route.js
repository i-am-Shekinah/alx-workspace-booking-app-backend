import { Router } from 'express';

import { createUser } from '../models/user.model.js';
import { generateToken } from '../utils/auth.util.js';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, preferences } = req.body;

    const user = await createUser({
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      preferences
    });

    const token = generateToken(user.id, user.role);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Error creating user:', error);

    if (error.code === 'P2002') {
      const targetField = error.meta?.target?.[0];
      return res.status(400).json({ error: `${targetField} is already taken` })
    }

    res.status(500).json({ error: 'Failed to create user\nAn unexpected error occurred!' })
  }
})

export default router;