import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient;

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};


export const comparePasswords = async (inputPassword, hashedPassword) => {
  return await bcrypt.compare(inputPassword, hashedPassword);
};


export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role }, 
    process.env.JWT_ACCESS_SECRET, 
    { expiresIn: '15m' }
  );
};


export const generateRefreshToken = (userId, role, refreshTokenExpiry) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: refreshTokenExpiry }
  );
};


export const hashRefreshToken = async (refreshToken) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(refreshToken, salt);
}

export const saveHashedRefreshTokenInDB = async (userId, refreshToken, expiresAt) => {
  const hashedRefreshToken = await hashRefreshToken(refreshToken);

  prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashedRefreshToken,
      deviceName,
      ipAddress,
      userAgent,
      expiresAt
    }
  })
}