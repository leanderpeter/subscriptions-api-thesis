import createLogger from "~/src/utils/logger";

describe("logger utils", () => {
  const testEntry = {
    actor: "jest",
  };
  describe("createLogger", () => {
    test("should return logger of type Logger", () => {
      const logger = createLogger("test");
      expect(logger).toHaveProperty("debug");
      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("error");
    });

    test("returned object uses winston logger functions", () => {
      // TODO spy on winston logger functions with same names. "logger.ts" needs to be more injectable
      const logger = createLogger("test");
      logger.debug("test_debug", testEntry);
      logger.info("test_debug", testEntry);
      logger.warn("test_debug", testEntry);
      logger.error("test_debug", { ...testEntry, err: "testError" });
    });
  });
});
