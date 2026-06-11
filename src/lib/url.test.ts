import { describe, expect, it } from "vitest";
import { toLinkHref } from "@/lib/url";

describe("toLinkHref", () => {
  it("keeps absolute http(s) urls", () => {
    expect(toLinkHref("https://khanacademy.org/x")).toBe(
      "https://khanacademy.org/x",
    );
    expect(toLinkHref("http://example.com")).toBe("http://example.com/");
  });

  it("adds https to a protocol-less domain so it's not a relative link", () => {
    expect(toLinkHref("youtube.com/watch?v=abc")).toBe(
      "https://youtube.com/watch?v=abc",
    );
    expect(toLinkHref("www.example.org")).toBe("https://www.example.org/");
  });

  it("treats free-text notes as not-a-link", () => {
    expect(toLinkHref("buy groceries")).toBeNull();
    expect(toLinkHref("Genesis 1:1")).toBeNull();
    expect(toLinkHref("")).toBeNull();
    expect(toLinkHref(null)).toBeNull();
    expect(toLinkHref("   ")).toBeNull();
  });

  it("rejects non-http schemes", () => {
    expect(toLinkHref("javascript:alert(1)")).toBeNull();
    expect(toLinkHref("mailto:a@b.com")).toBeNull();
  });
});
