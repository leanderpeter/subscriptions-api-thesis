import { mockSubscription } from "~/src/mocks/model";
import { mockSubRepository } from "~/src/mocks/repo";
import { NotFoundError } from "~/src/domain/types/errors";
import { markAsCanceled } from "~/src/domain/subscriptions/mark-as-canceled";
import { SubscriptionState } from "~/src/domain/types/subscription";

function createContext() {
  const subRepo = mockSubRepository();
  return {
    subRepo,
    markAsCanceled: markAsCanceled({ subRepo }),
  };
}

const testInput = {
  id: "sub-id-123",
  terminationReason: "Credit score not in boundries",
  terminationDate: new Date(),
  metadata: { requestId: "test-132", actor: "Leander" },
};

describe("Mark subscription as canceled", () => {
  test("not found", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new NotFoundError("s"));

    const op = ctx.markAsCanceled(testInput);

    await expect(op).rejects.toThrowError(NotFoundError);
  });

  test("generic error", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new Error("death"));

    const op = ctx.markAsCanceled(testInput);

    await expect(op).rejects.toThrowError(Error);
  });

  test("not in state created - should return ConflictError", async () => {
    const ctx = createContext();
    const sub = mockSubscription({ state: SubscriptionState.ACTIVE });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const op = ctx.markAsCanceled(testInput);
    await expect(op).rejects.toThrowError(Error);
  });

  test("should throw Error if update fails", async () => {
    const ctx = createContext();
    const sub = mockSubscription({ state: SubscriptionState.CREATED });
    ctx.subRepo.getById.mockResolvedValue(sub);
    ctx.subRepo.update.mockRejectedValueOnce(new Error());

    const op = ctx.markAsCanceled(testInput);

    await expect(op).rejects.toThrowError(Error);
  });

  test("should return updated subscription", async () => {
    const ctx = createContext();
    const sub = mockSubscription({ state: SubscriptionState.CREATED });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const updatedSub = mockSubscription({ state: SubscriptionState.CANCELED });

    ctx.subRepo.update.mockResolvedValue(updatedSub);
    const op = await ctx.markAsCanceled(testInput);

    expect(op.state).toEqual(updatedSub.state);
  });
});
