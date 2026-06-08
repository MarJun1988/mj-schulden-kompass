import nodemailer from "nodemailer";
import type { Prisma } from "@prisma/client";

import { config } from "../config.js";
import { escapeHtml } from "../utils/html.js";

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
  try {
    await mailTransport.sendMail({
      from: config.mailFrom,
      ...mail,
    });
  } catch (error) {
    console.error("E-Mail konnte nicht gesendet werden:", error);
  }
};

export const sendRegistrationMail = async (user: { name: string; email: string }) => {
  const safeName = escapeHtml(user.name);

  await sendMail({
    to: user.email,
    subject: "Willkommen bei SchuldKompass",
    text: [
      `Hallo ${user.name},`,
      "",
      "deine Registrierung bei SchuldKompass war erfolgreich.",
      `Du kannst dich hier anmelden: ${config.appUrl}`,
      "",
      "Viele Grüße",
      "SchuldKompass",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #17201a;">
        <h1>Willkommen bei SchuldKompass</h1>
        <p>Hallo ${safeName},</p>
        <p>deine Registrierung bei SchuldKompass war erfolgreich.</p>
        <p><a href="${config.appUrl}">Jetzt anmelden</a></p>
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
