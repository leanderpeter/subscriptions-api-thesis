import { getValueFromEnv } from "~/src/utils/system-utils";

describe("system-utils", () => {
  beforeAll(() => {
    process.env.TEST_VAR_1 = "test";
  });
  describe("getValueFromEnv", () => {
    test("returns a value from env", () => {
      const value = getValueFromEnv("TEST_VAR_1");
      expect(value).toBe("test");
    });
    test("throws an error if env value is not set", () => {
      expect(() => {
        getValueFromEnv("TEST_VAR_2");
      }).toThrow("missing env variable");
    });
  });
});
