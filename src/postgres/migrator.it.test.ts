import PostgresMigrator from "~/src/postgres/migrator";
import createTestDB, { TestDBContext } from "~/src/postgres/test-utils";

describe("PostgresMigrator", () => {
  describe("applyMigrations", () => {
    let dBCtx: TestDBContext;
    beforeAll(async () => {
      dBCtx = await createTestDB();
    });
    afterAll(async () => {
      await dBCtx?.destroy();
    });
    test("success", async () => {
      const migrator = new PostgresMigrator(dBCtx.knex);
      const output = await migrator.applyMigrations();
      expect(output).toBe("success");
    });
  });
});
