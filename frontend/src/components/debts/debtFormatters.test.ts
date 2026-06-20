import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deletionStatusText, formatDate } from "./debtFormatters.ts";

describe("debt formatters", () => {
  it("formats empty dates as dash", () => {
    assert.equal(formatDate(null), "-");
  });

  it("formats deletion status text", () => {
    assert.equal(deletionStatusText("PENDING"), "Löschung beantragt");
    assert.equal(deletionStatusText("REJECTED"), "Löschung abgelehnt");
    assert.equal(deletionStatusText(null), null);
  });
});
