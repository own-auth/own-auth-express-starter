import { describe, expect, it } from "vitest";

import { formatSessionLabel } from "@/lib/session-display";

describe("formatSessionLabel", () => {
  it.each([
    ["Mozilla/5.0 (Macintosh) Chrome/140.0", "Chrome on Mac"],
    ["Mozilla/5.0 (Windows) Edg/140.0", "Edge on Windows"],
    ["Mozilla/5.0 (iPhone) Version/18 Safari/605.1", "Safari on iPhone"],
    [null, "Unknown device"]
  ])("formats %s", (userAgent, expected) => {
    expect(formatSessionLabel(userAgent)).toBe(expected);
  });
});
