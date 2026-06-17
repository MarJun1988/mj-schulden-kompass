export const normalizeVersion = (version: string) => version.trim().replace(/^v/i, "");

export const compareVersions = (nextVersion: string, currentVersion: string) => {
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
