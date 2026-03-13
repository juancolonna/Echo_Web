import { PrismaClient } from "@prisma/client"
import type { User } from "@prisma/client";
import { LoginDto } from "./auth.types"
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

export const checkCredentials = async (data: LoginDto): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { email: data.email }
  });

  if (!user) return null;

  const ok = await compare(data.password, user.password);
  if (ok) return user;

  return null;
}
