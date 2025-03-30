import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createUser = async (userData) => {

  const user = await prisma.user.create({
    data: userData
  });

  return user;
};

export const getUserByEmail = async (email) => await prisma.user.findUnique({ where: { email } });