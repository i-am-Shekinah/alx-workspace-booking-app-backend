import { PrismaClient } from '@prisma/client';

import { hashPassword } from '../utils/auth.util.js';

const prisma = new PrismaClient();

export const createUser = async (userData) => {
  const hashedPassword = await hashPassword(userData.password);

  const user = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });

  return user;
};

export const getUserByEmail = async (email) => await prisma.user.findUnique({ where: { email } });