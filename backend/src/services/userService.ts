import { GraphQLError } from "graphql";
import bcrypt from "bcryptjs";

import { createToken } from "../auth/token.js";
import { prisma } from "../db/prisma.js";
import { toGraphQLUser } from "../mappers/userMapper.js";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "../types/user.js";
import { normalizeEmail } from "../utils/email.js";
import { sendRegistrationMail } from "./mailService.js";

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user ? toGraphQLUser(user) : null;
};

export const register = async (input: RegisterInput) => {
  const email = normalizeEmail(input.email);

  if (input.password.length < 8) {
    throw new GraphQLError("Das Passwort muss mindestens 8 Zeichen haben.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
    },
  });
  await sendRegistrationMail(user);

  return {
    token: createToken({ id: user.id, email: user.email }),
    user: toGraphQLUser(user),
  };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(input.email) },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new GraphQLError("E-Mail oder Passwort ist falsch.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return {
    token: createToken({ id: user.id, email: user.email }),
    user: toGraphQLUser(user),
  };
};

export const changePassword = async (userId: string, input: ChangePasswordInput) => {
  if (input.newPassword.length < 8) {
    throw new GraphQLError("Das neue Passwort muss mindestens 8 Zeichen haben.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new GraphQLError("Das aktuelle Passwort ist falsch.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return true;
};
