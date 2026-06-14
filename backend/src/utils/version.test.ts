import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compareVersions, normalizeVersion } from "./version.js";

describe("version utilities", () => {
  it("normalizes leading v prefixes", () => {
    assert.equal(normalizeVersion("v0.1.7"), "0.1.7");
    assert.equal(normalizeVersion(" V1.0.0 "), "1.0.0");
  });

  it("compares semantic version numbers", () => {
    assert.equal(compareVersions("0.1.8", "0.1.7") > 0, true);
    assert.equal(compareVersions("1.0.0", "0.9.9") > 0, true);
    assert.equal(compareVersions("0.1.7", "0.1.7"), 0);
    assert.equal(compareVersions("0.1.6", "0.1.7") < 0, true);
  });
});
