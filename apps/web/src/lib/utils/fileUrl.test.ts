import { describe, expect, it } from "vitest";
import { pocketbaseFileUrl } from "./fileUrl";

describe("pocketbaseFileUrl", () => {
  it("returns empty for missing inputs", () => {
    expect(pocketbaseFileUrl("", "id", "a.png")).toBe("");
    expect(pocketbaseFileUrl("c", "", "a.png")).toBe("");
    expect(pocketbaseFileUrl("c", "id", "")).toBe("");
  });

  it("adds thumb param when provided", () => {
    const url = pocketbaseFileUrl("plugins", "rid", "a.png", {
      thumb: "100x100",
    });
    expect(url).toContain("/api/files/plugins/rid/a.png");
    expect(url).toContain("thumb=100x100");
  });
});
