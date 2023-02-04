import moxios from "moxios";
import HttpHealthIndicator from "~/src/adapters/health-indicator";

describe("HttpClient", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  describe("health", () => {
    test("success", async () => {
      moxios.stubRequest("https://canhazip.com/", {
        status: 200,
        response: "8.8.8.8\n",
      });
      const indicator = new HttpHealthIndicator();
      const output = await indicator.health();
      expect(output).toBe("8.8.8.8");
    });
    test("failure", async () => {
      moxios.stubTimeout("https://canhazip.com/");
      const indicator = new HttpHealthIndicator();
      const output = indicator.health();
      await expect(output).rejects.toThrow("timeout of 5000ms exceeded");
    });
  });
});
