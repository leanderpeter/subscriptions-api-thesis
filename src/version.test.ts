import VERSION from "~/src/version";

describe("version", () => {
  test("should export a valid version", () => {
    expect(VERSION).toBeTruthy();
    expect(typeof VERSION).toBe("string");
  });
});
