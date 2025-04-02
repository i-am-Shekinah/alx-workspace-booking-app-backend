import Joi from 'joi';

import {
  createUser,
  getUserByEmail,
  getUserByUsername,
} from '../models/user.model.js';
import {
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  saveHashedRefreshTokenInDB,
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
  .required(),


  lastName: Joi.string()
  .trim()
  .required(),


  role: Joi.string().valid('admin', 'learner', 'employee').trim().required(),

  preferences: Joi.object().optional(),

  rememberMe: Joi.boolean().default(false)
});


const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().default(false)
})

export const signupUser = async (req, res) => {
  const { value: userData, error } = signupSchema.validate(req.body, { abortEarly: false, convert: true, stripUnknown: true });

  if (error) {
    return res.status(400).json({ errors: 'Validation Failed', details: error.details.map(err => err.message) });
  }

  try {
    const isExistingEmail = await getUserByEmail(userData.email);
    if (isExistingEmail) {
      return res.status(400).json({ error: 'Email is already taken' });
    }

    const isExistingUsername = await getUserByUsername(userData.username);
    if (isExistingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const { rememberMe, ...restUserData } = userData;

    restUserData.firstName = toTitleCase(restUserData.firstName);
    restUserData.lastName = toTitleCase(restUserData.lastName);
    restUserData.password = await hashPassword(restUserData.password);

    // set tokenExpiry and cookieMaxAge
    const refreshTokenExpiry = rememberMe ? '30d' : '1d';
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const user = await createUser(restUserData);

    // generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role, refreshTokenExpiry);
    
    
    // store refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge
    });

    const { password: _, ...safeUser } = user;

    res.status(201).json({ message: 'User created successfully', user: safeUser, accessToken });
  } catch (error) {
    console.error('Signup error:', error.message);
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
    const { email, password, rememberMe } = userCredentials;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordAMatch = await comparePasswords(password, user.password);
    if(!isPasswordAMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password: _, ...safeUser } = user;


    // set refreshTokenExpiry and cookieMaxAge
    const refreshTokenExpiry = rememberMe ? '30d' : '1d';
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role, refreshTokenExpiry);
    saveHashedRefreshTokenInDB(user.id, refreshToken, refreshTokenExpiry);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge
    });

    res.status(200).json({ message: 'Login successful', user: safeUser, accessToken });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}


export const logoutUser = (req, res) => {
  res.clearCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: 'Logged out successfully' });
}


export const issueNewAccessToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token not found '});

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });

    const newAccessToken = generateRefreshToken(user.id, user.role);
    res.status(200).json({ message: 'A new token has been issued', accessToken: newAccessToken });
  })
}