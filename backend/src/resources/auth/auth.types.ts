import type { User } from "@prisma/client";
import { CreateUserDto } from "../user/user.types";

export type SignUpDto = Omit<CreateUserDto, "userTypeId">;
export type LoginDto = Pick<User, "email" | "password">;
