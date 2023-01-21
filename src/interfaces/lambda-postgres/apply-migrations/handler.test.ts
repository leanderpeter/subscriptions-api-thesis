import createHandler from "~/src/interfaces/lambda-postgres/apply-migrations/handler";

describe("apply migrations handler", () => {
  test("success", async () => {
    const deps = {
      pgMigrator: {
        applyMigrations: jest.fn().mockResolvedValue("applied migrations"),
      },
    };
    const handler = createHandler(deps);
    const results = await handler();
    expect(results).toBe("success");
  });
  test("failure", async () => {
    const deps = {
      pgMigrator: {
        applyMigrations: jest
          .fn()
          .mockRejectedValue(new Error("failed to apply migrations")),
      },
    };
    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow("failed to apply migrations");
  });
});
