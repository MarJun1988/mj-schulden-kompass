import { prisma } from "../db/prisma.js";
import { config } from "../config.js";
import { logger, serializeError } from "../utils/logger.js";

export interface AppVersionRecord {
  id: string;
  version: string;
  title: string;
  description: string;
  notes: string[];
  releasedAt: Date;
  createdAt: Date;
}

interface GithubReleaseResponse {
  tag_name?: string;
  html_url?: string;
}

export interface ReleaseStatus {
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  checkedAt: Date;
}

let cachedReleaseStatus: ReleaseStatus | null = null;
let cachedReleaseStatusUntil = 0;

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

export const getReleaseStatus = async (): Promise<ReleaseStatus> => {
  const now = Date.now();

  if (cachedReleaseStatus && now < cachedReleaseStatusUntil) {
    return cachedReleaseStatus;
  }

  const latestAppVersion = await getLatestAppVersion();
  const currentVersion = latestAppVersion?.version ?? null;
  const checkedAt = new Date();

  try {
    const latestRelease = await fetchLatestGithubRelease();
    const latestVersion = latestRelease.tagName ? normalizeVersion(latestRelease.tagName) : null;
    const updateAvailable =
      currentVersion !== null &&
      latestVersion !== null &&
      compareVersions(latestVersion, currentVersion) > 0;

    cachedReleaseStatus = {
      currentVersion,
      latestVersion,
      updateAvailable,
      releaseUrl: latestRelease.url,
      checkedAt,
    };

    logger.info("github release status checked", {
      currentVersion,
      latestVersion,
      updateAvailable,
      repository: config.githubReleaseRepository,
    });
  } catch (error) {
    logger.warn("github release status check failed", {
      repository: config.githubReleaseRepository,
      error: serializeError(error),
    });

    cachedReleaseStatus = {
      currentVersion,
      latestVersion: null,
      updateAvailable: false,
      releaseUrl: null,
      checkedAt,
    };
  }

  cachedReleaseStatusUntil = now + Math.max(config.githubReleaseCheckTtlMinutes, 1) * 60 * 1000;

  return cachedReleaseStatus;
};

const fetchLatestGithubRelease = async () => {
  const response = await fetch(
    `https://api.github.com/repos/${config.githubReleaseRepository}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "SchuldKompass",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub release check failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GithubReleaseResponse;

  return {
    tagName: payload.tag_name ?? null,
    url: payload.html_url ?? null,
  };
};

const normalizeVersion = (version: string) => version.trim().replace(/^v/i, "");

const compareVersions = (nextVersion: string, currentVersion: string) => {
  const nextParts = parseVersionParts(nextVersion);
  const currentParts = parseVersionParts(currentVersion);
  const length = Math.max(nextParts.length, currentParts.length);

  for (let index = 0; index < length; index += 1) {
    const nextPart = nextParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;

    if (nextPart !== currentPart) {
      return nextPart - currentPart;
    }
  }

  return 0;
};

const parseVersionParts = (version: string) =>
  normalizeVersion(version)
    .split(/[.-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
