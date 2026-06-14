import nodemailer from "nodemailer";
import type { Prisma } from "@prisma/client";

import { config } from "../config.js";
import { escapeHtml } from "../utils/html.js";
import { logger, maskEmail, serializeError } from "../utils/logger.js";

const currency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});
const dateFormatter = new Intl.DateTimeFormat("de-DE");
const mailTransport = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: config.smtp.user
    ? {
        user: config.smtp.user,
        pass: config.smtp.pass,
      }
    : undefined,
});

export const sendMail = async (mail: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  logger.info("mail.send.started", {
    to: maskEmail(mail.to),
    subject: mail.subject,
  });

  try {
    await mailTransport.sendMail({
      from: config.mailFrom,
      ...mail,
    });

    logger.info("mail.send.completed", {
      to: maskEmail(mail.to),
      subject: mail.subject,
    });

    return true;
  } catch (error) {
    logger.error("mail.send.failed", {
      to: maskEmail(mail.to),
      subject: mail.subject,
      error: serializeError(error),
    });

    return false;
  }
};

export const sendRegistrationMail = async (
  user: { name: string; email: string },
  token: string,
) => {
  const safeName = escapeHtml(user.name);
  const activationUrl = `${config.appUrl.replace(/\/$/, "")}/activate?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: user.email,
    subject: "Aktiviere dein SchuldKompass Konto",
    text: [
      `Hallo ${user.name},`,
      "",
      "bitte bestätige deine E-Mail-Adresse, um dein SchuldKompass Konto zu aktivieren.",
      `Aktivierungslink: ${activationUrl}`,
      "",
      "Der Link ist 24 Stunden gültig.",
      "",
      "Viele Grüße",
      "SchuldKompass",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #17201a;">
        <h1>Konto aktivieren</h1>
        <p>Hallo ${safeName},</p>
        <p>bitte bestätige deine E-Mail-Adresse, um dein SchuldKompass Konto zu aktivieren.</p>
        <p><a href="${activationUrl}">Konto aktivieren</a></p>
        <p>Der Link ist 24 Stunden gültig.</p>
      </div>
    `,
  });
};

export const sendDebtCreatedMail = async (debt: {
  debtorName: string;
  debtorEmail: string;
  amount: Prisma.Decimal;
  purpose: string;
  comment: string | null;
  category: string;
  debtDate: Date;
  creator: {
    name: string;
    email: string;
  };
}) => {
  const amount = currency.format(Number(debt.amount));
  const debtDate = dateFormatter.format(debt.debtDate);
  const safeDebtorName = escapeHtml(debt.debtorName);
  const safeCreatorName = escapeHtml(debt.creator.name);
  const safePurpose = escapeHtml(debt.purpose);
  const safeComment = debt.comment ? escapeHtml(debt.comment) : null;
  const safeCategory = escapeHtml(debt.category);

  await sendMail({
    to: debt.debtorEmail,
    subject: `${debt.creator.name} hat eine Schuld eingetragen`,
    text: [
      `Hallo ${debt.debtorName},`,
      "",
      `${debt.creator.name} hat bei SchuldKompass eine neue Schuld für dich eingetragen.`,
      "",
      `Betrag: ${amount}`,
      `Zweck: ${debt.purpose}`,
      ...(debt.comment ? [`Kommentar: ${debt.comment}`] : []),
      `Kategorie: ${debt.category}`,
      `Datum: ${debtDate}`,
      "",
      `Du kannst deine offenen und bezahlten Schulden hier ansehen: ${config.appUrl}`,
      `Melde dich dafür mit dieser E-Mail-Adresse an: ${debt.debtorEmail}`,
      "",
      "Viele Grüße",
      "SchuldKompass",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #17201a;">
        <h1>Neue Schuld eingetragen</h1>
        <p>Hallo ${safeDebtorName},</p>
        <p>${safeCreatorName} hat bei SchuldKompass eine neue Schuld für dich eingetragen.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 12px 4px 0;">Betrag</td><td><strong>${amount}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Zweck</td><td>${safePurpose}</td></tr>
          ${
            safeComment
              ? `<tr><td style="padding: 4px 12px 4px 0;">Kommentar</td><td>${safeComment}</td></tr>`
              : ""
          }
          <tr><td style="padding: 4px 12px 4px 0;">Kategorie</td><td>${safeCategory}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Datum</td><td>${debtDate}</td></tr>
        </table>
        <p><a href="${config.appUrl}">Schulden ansehen</a></p>
        <p>Melde dich dafür mit dieser E-Mail-Adresse an: ${escapeHtml(debt.debtorEmail)}</p>
      </div>
    `,
  });
};

export const sendDebtReminderMail = async (debt: {
  debtorName: string;
  debtorEmail: string;
  amount: Prisma.Decimal;
  purpose: string;
  comment: string | null;
  category: string;
  debtDate: Date;
  creator: {
    name: string;
    email: string;
  };
}) => {
  const amount = currency.format(Number(debt.amount));
  const debtDate = dateFormatter.format(debt.debtDate);
  const safeDebtorName = escapeHtml(debt.debtorName);
  const safeCreatorName = escapeHtml(debt.creator.name);
  const safePurpose = escapeHtml(debt.purpose);
  const safeComment = debt.comment ? escapeHtml(debt.comment) : null;
  const safeCategory = escapeHtml(debt.category);

  return sendMail({
    to: debt.debtorEmail,
    subject: `${debt.creator.name} erinnert dich an eine offene Schuld`,
    text: [
      `Hallo ${debt.debtorName},`,
      "",
      `${debt.creator.name} erinnert dich an eine noch offene Schuld bei SchuldKompass.`,
      "",
      `Betrag: ${amount}`,
      `Zweck: ${debt.purpose}`,
      ...(debt.comment ? [`Kommentar: ${debt.comment}`] : []),
      `Kategorie: ${debt.category}`,
      `Datum: ${debtDate}`,
      "",
      `Du kannst deine offenen Schulden hier ansehen: ${config.appUrl}`,
      "",
      "Viele Grüße",
      "SchuldKompass",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #17201a;">
        <h1>Erinnerung an offene Schuld</h1>
        <p>Hallo ${safeDebtorName},</p>
        <p>${safeCreatorName} erinnert dich an eine noch offene Schuld bei SchuldKompass.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 12px 4px 0;">Betrag</td><td><strong>${amount}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Zweck</td><td>${safePurpose}</td></tr>
          ${
            safeComment
              ? `<tr><td style="padding: 4px 12px 4px 0;">Kommentar</td><td>${safeComment}</td></tr>`
              : ""
          }
          <tr><td style="padding: 4px 12px 4px 0;">Kategorie</td><td>${safeCategory}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Datum</td><td>${debtDate}</td></tr>
        </table>
        <p><a href="${config.appUrl}">Offene Schulden ansehen</a></p>
      </div>
    `,
  });
};

export const sendDebtPaidMail = async (debt: {
  debtorName: string;
  debtorEmail: string;
  amount: Prisma.Decimal;
  purpose: string;
  comment: string | null;
  category: string;
  debtDate: Date;
  paidAt: Date;
  creator: {
    name: string;
    email: string;
  };
}) => {
  const amount = currency.format(Number(debt.amount));
  const debtDate = dateFormatter.format(debt.debtDate);
  const paidAt = dateFormatter.format(debt.paidAt);
  const safeDebtorName = escapeHtml(debt.debtorName);
  const safeCreatorName = escapeHtml(debt.creator.name);
  const safePurpose = escapeHtml(debt.purpose);
  const safeComment = debt.comment ? escapeHtml(debt.comment) : null;
  const safeCategory = escapeHtml(debt.category);

  return sendMail({
    to: debt.debtorEmail,
    subject: `${debt.creator.name} hat eine Schuld als bezahlt markiert`,
    text: [
      `Hallo ${debt.debtorName},`,
      "",
      `${debt.creator.name} hat bei SchuldKompass eine Schuld als bezahlt markiert.`,
      "",
      `Betrag: ${amount}`,
      `Zweck: ${debt.purpose}`,
      ...(debt.comment ? [`Kommentar: ${debt.comment}`] : []),
      `Kategorie: ${debt.category}`,
      `Ursprungsdatum: ${debtDate}`,
      `Bezahlt am: ${paidAt}`,
      "",
      `Du kannst den aktuellen Stand hier ansehen: ${config.appUrl}`,
      "",
      "Viele Grüße",
      "SchuldKompass",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #17201a;">
        <h1>Schuld als bezahlt markiert</h1>
        <p>Hallo ${safeDebtorName},</p>
        <p>${safeCreatorName} hat bei SchuldKompass eine Schuld als bezahlt markiert.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 12px 4px 0;">Betrag</td><td><strong>${amount}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Zweck</td><td>${safePurpose}</td></tr>
          ${
            safeComment
              ? `<tr><td style="padding: 4px 12px 4px 0;">Kommentar</td><td>${safeComment}</td></tr>`
              : ""
          }
          <tr><td style="padding: 4px 12px 4px 0;">Kategorie</td><td>${safeCategory}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Ursprungsdatum</td><td>${debtDate}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;">Bezahlt am</td><td>${paidAt}</td></tr>
        </table>
        <p><a href="${config.appUrl}">Schulden ansehen</a></p>
      </div>
    `,
  });
};
