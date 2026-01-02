import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("trims and removes punctuation", () => {
    expect(slugify('  Foo\'s "Bar"  ')).toBe("foos-bar");
  });
});
