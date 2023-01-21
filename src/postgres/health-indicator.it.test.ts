import { Knex } from "knex";
import PostgresHealthIndicator from "~/src/postgres/health-indicator";
import createTestDB, { connection, TestDBContext } from "./test-utils";

describe("PostgresHealthIndicator", () => {
  describe("health", () => {
    let healthyDBCtx: TestDBContext;
    let invalidConnection: Knex;
    beforeAll(async () => {
      healthyDBCtx = await createTestDB();
      invalidConnection = connection("non_existent_db");
    });
    afterAll(async () => {
      await healthyDBCtx?.destroy();
      await invalidConnection?.destroy();
    });
    test("success", async () => {
      const healthIndicator = new PostgresHealthIndicator(healthyDBCtx.knex);
      const output = await healthIndicator.health();
      expect(output).toBeGreaterThanOrEqual(0);
    });
    test("failure", async () => {
      const healthIndicator = new PostgresHealthIndicator(invalidConnection);
      await expect(healthIndicator.health()).rejects.toThrow(
        'database "non_existent_db" does not exist'
      );
    });
  });
});
