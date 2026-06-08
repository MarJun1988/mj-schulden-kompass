import { prisma } from "../db/prisma.js";

export interface AppVersionRecord {
  id: string;
  version: string;
  title: string;
  description: string;
  notes: string[];
  releasedAt: Date;
  createdAt: Date;
}

export const getAppVersions = async () =>
  prisma.$queryRaw<AppVersionRecord[]>`
    SELECT
      "id",
      "version",
      "title",
      "description",
      "notes",
      "releasedAt",
      "createdAt"
    FROM "AppVersion"
    ORDER BY "releasedAt" DESC, "createdAt" DESC
  `;

export const getLatestAppVersion = async () => {
  const versions = await prisma.$queryRaw<AppVersionRecord[]>`
    SELECT
      "id",
      "version",
      "title",
      "description",
      "notes",
      "releasedAt",
      "createdAt"
    FROM "AppVersion"
    ORDER BY "releasedAt" DESC, "createdAt" DESC
    LIMIT 1
  `;

  return versions.at(0) ?? null;
};
