import createHealthcheck, {
  Dependencies,
} from "~/src/domain/system/healthcheck";

describe("healthcheck action", () => {
  const healthyDeps: Dependencies = {
    http: {
      health: jest.fn().mockResolvedValue("8.8.8.8"),
    },
    db: {
      health: jest.fn().mockResolvedValue(100),
    },
  };
  describe("createHealthcheck", () => {
    test("no dep should be failing", async () => {
      const healthcheck = createHealthcheck(healthyDeps);
      const response = await healthcheck();
      expect(response).toHaveProperty("version");
      expect(response.db).toBeGreaterThanOrEqual(0);
      expect(response.ip).toBe("8.8.8.8");
    });
    test("db dep should be failing", async () => {
      const failDBDeps: Dependencies = {
        http: {
          health: jest.fn().mockResolvedValue("8.8.8.8"),
        },
        db: {
          health: jest.fn().mockRejectedValue("fail"),
        },
      };
      const healthcheck = createHealthcheck(failDBDeps);
      const response = await healthcheck();
      expect(response).toHaveProperty("version");
      expect(response.db).toBe("fail");
      expect(response.ip).toBe("8.8.8.8");
    });
    test("http dep should be failing", async () => {
      const failHttpDeps: Dependencies = {
        http: {
          health: jest.fn().mockRejectedValue("fail"),
        },
        db: {
          health: jest.fn().mockResolvedValue(100),
        },
      };
      const healthcheck = createHealthcheck(failHttpDeps);
      const response = await healthcheck();
      expect(response).toHaveProperty("version");
      expect(response.db).toBeGreaterThanOrEqual(0);
      expect(response.ip).toBe("fail");
    });
    test("all dep should be failing", async () => {
      const failingDeps: Dependencies = {
        http: {
          health: jest.fn().mockRejectedValue("fail"),
        },
        db: {
          health: jest.fn().mockRejectedValue("fail"),
        },
      };
      const healthcheck = createHealthcheck(failingDeps);
      const response = await healthcheck();
      expect(response).toHaveProperty("version");
      expect(response.db).toBe("fail");
      expect(response.ip).toBe("fail");
    });
  });
});
