import { mockSubscription } from "~/src/mocks/model";
import { mockSubRepository } from "~/src/mocks/repo";
import { NotFoundError } from "~/src/domain/types/errors";
import { markAsEnded } from "~/src/domain/subscriptions/mark-as-ended";
import { SubscriptionState } from "~/src/domain/types/subscription";

function createContext() {
  const subRepo = mockSubRepository();
  return {
    subRepo,
    markAsEnded: markAsEnded({ subRepo }),
  };
}

const testInput = {
  id: "sub-id-123",
  metadata: { requestId: "test-132", actor: "Leander" },
};

describe("Mark subscription as ended", () => {
  test("not found", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new NotFoundError("s"));

    const op = ctx.markAsEnded(testInput);

    await expect(op).rejects.toThrowError(NotFoundError);
  });

  test("generic error", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new Error("death"));

    const op = ctx.markAsEnded(testInput);

    await expect(op).rejects.toThrowError(Error);
  });

  test("not in state inactive - should return ConflictError", async () => {
    const ctx = createContext();
    const sub = mockSubscription({ state: SubscriptionState.ACTIVE });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const op = ctx.markAsEnded(testInput);
    await expect(op).rejects.toThrowError(Error);
  });

  test("should throw Error if update fails", async () => {
    const ctx = createContext();
    const sub = mockSubscription({ state: SubscriptionState.INACTIVE });
    ctx.subRepo.getById.mockResolvedValue(sub);
    ctx.subRepo.update.mockRejectedValueOnce(new Error());

    const op = ctx.markAsEnded(testInput);

    await expect(op).rejects.toThrowError(Error);
  });

  test("should return updated subscription", async () => {
    const ctx = createContext();
    const sub = mockSubscription({ state: SubscriptionState.INACTIVE });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const updatedSub = mockSubscription({ state: SubscriptionState.INACTIVE });

    ctx.subRepo.update.mockResolvedValue(updatedSub);
    const op = await ctx.markAsEnded(testInput);

    expect(op.state).toEqual(updatedSub.state);
  });
});
