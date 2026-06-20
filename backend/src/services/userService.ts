import { GraphQLError } from "graphql";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

import { createToken } from "../auth/token.js";
import { prisma } from "../db/prisma.js";
import { toGraphQLUser } from "../mappers/userMapper.js";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "../types/user.js";
import { normalizeEmail } from "../utils/email.js";
import { logger, maskEmail } from "../utils/logger.js";
import { sendRegistrationMail } from "./mailService.js";

const createEmailVerificationToken = () => randomBytes(32).toString("hex");
const createEmailVerificationExpiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user ? toGraphQLUser(user) : null;
};

export const register = async (input: RegisterInput) => {
  const email = normalizeEmail(input.email);

  logger.info("auth.register.started", { email: maskEmail(email) });

  if (input.password.length < 8) {
    logger.warn("auth.register.rejected", {
      email: maskEmail(email),
      reason: "password_too_short",
    });
    throw new GraphQLError("Das Passwort muss mindestens 8 Zeichen haben.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const emailVerificationToken = createEmailVerificationToken();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser?.emailVerifiedAt) {
    logger.warn("auth.register.rejected", {
      email: maskEmail(email),
      reason: "email_already_registered",
      userId: existingUser.id,
    });
    throw new GraphQLError("Diese E-Mail-Adresse ist bereits registriert.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (existingUser) {
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: input.name.trim(),
        passwordHash,
        emailVerificationToken,
        emailVerificationExpiresAt: createEmailVerificationExpiry(),
      },
    });
    await sendRegistrationMail(user, emailVerificationToken);
    logger.info("auth.register.verification_resent", {
      userId: user.id,
      email: maskEmail(user.email),
    });

    return true;
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      emailVerificationToken,
      emailVerificationExpiresAt: createEmailVerificationExpiry(),
    },
  });
  await sendRegistrationMail(user, emailVerificationToken);
  logger.info("auth.register.completed", {
    userId: user.id,
    email: maskEmail(user.email),
  });

  return true;
};

export const verifyEmail = async (token: string) => {
  logger.info("auth.verify_email.started");

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });

  if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    logger.warn("auth.verify_email.rejected", { reason: "invalid_or_expired_token" });
    throw new GraphQLError("Der Aktivierungslink ist ungültig oder abgelaufen.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  logger.info("auth.verify_email.completed", {
    userId: verifiedUser.id,
    email: maskEmail(verifiedUser.email),
  });

  return {
    token: createToken({ id: verifiedUser.id, email: verifiedUser.email }),
    user: toGraphQLUser(verifiedUser),
  };
};

export const login = async (input: LoginInput) => {
  const email = normalizeEmail(input.email);
  logger.info("auth.login.started", { email: maskEmail(email) });

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    logger.warn("auth.login.rejected", {
      email: maskEmail(email),
      reason: "invalid_credentials",
      userId: user?.id,
    });
    throw new GraphQLError("E-Mail oder Passwort ist falsch.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (!user.emailVerifiedAt) {
    logger.warn("auth.login.rejected", {
      email: maskEmail(email),
      reason: "email_not_verified",
      userId: user.id,
    });
    throw new GraphQLError("Bitte bestätige zuerst deine E-Mail-Adresse.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  logger.info("auth.login.completed", {
    userId: user.id,
    email: maskEmail(user.email),
  });

  return {
    token: createToken({ id: user.id, email: user.email }),
    user: toGraphQLUser(user),
  };
};

export const changePassword = async (userId: string, input: ChangePasswordInput) => {
  logger.info("auth.change_password.started", { userId });

  if (input.newPassword.length < 8) {
    logger.warn("auth.change_password.rejected", {
      userId,
      reason: "password_too_short",
    });
    throw new GraphQLError("Das neue Passwort muss mindestens 8 Zeichen haben.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    logger.warn("auth.change_password.rejected", {
      userId,
      reason: "invalid_current_password",
    });
    throw new GraphQLError("Das aktuelle Passwort ist falsch.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  logger.info("auth.change_password.completed", { userId });

  return true;
};
