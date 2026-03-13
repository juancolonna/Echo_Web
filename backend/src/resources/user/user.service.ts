import { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";
import { CreateUserDto, UserDto } from "./user.types";

import getEnv from "../../utils/getEnv";
import { genSalt, hash } from "bcryptjs";

const prisma = new PrismaClient();
const env = getEnv();

export const getUser = async (userId?: string): Promise<UserDto | null> => {
  if (!userId) return null;

  return await prisma.user.findFirst({
    where: { id: userId },
  });
};

export const getUsers = async (): Promise<UserDto[]> => {
  const users = await prisma.user.findMany();

  return users.map(({ password, ...user }: User) => user);
};

export const createUser = async (data: CreateUserDto): Promise<UserDto> => {
  const salt = await genSalt(env.BCRYPT_ROUNDS);
  const passwd = await hash(data.password, salt);

  const { password, ...user } = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      userTypeId: data.userTypeId,
      password: passwd,
    },
  });

  return user;
};
