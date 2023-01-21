import createMigrator from "~/src/domain/system/apply-migrations";

describe("apply-migrations", () => {
  test("migrations should be applied successfully", async () => {
    const deps = {
      pgMigrator: {
        applyMigrations: jest.fn().mockResolvedValue("applied migrations"),
      },
    };
    const applyMigrations = createMigrator(deps);
    const results = await applyMigrations();
    expect(results).toBe("success");
  });
  test("should fail if migrations fail to apply", async () => {
    const deps = {
      pgMigrator: {
        applyMigrations: jest
          .fn()
          .mockRejectedValue(new Error("failed to apply migrations")),
      },
    };
    const applyMigrations = createMigrator(deps);
    await expect(applyMigrations()).rejects.toThrow(
      "failed to apply migrations"
    );
  });
});
