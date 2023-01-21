import faker from "@faker-js/faker";
import { mockSubscription } from "~/src/mocks/model";
import { mockSubRepository } from "~/src/mocks/repo";
import { ConflictError, NotFoundError } from "~/src/domain/types/errors";
import { markAsInactive } from "~/src/domain/subscriptions/mark-as-inactive";
import { SubscriptionState } from "~/src/domain/types/subscription";

function createContext() {
  const subRepo = mockSubRepository();
  return {
    subRepo,
    markAsInactive: markAsInactive({ subRepo }),
  };
}

const testInput = {
  id: "sub-id-123",
  metadata: { requestId: "test-132", actor: "Leander" },
};

describe("Mark subscription as inactive", () => {
  test("not found", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new NotFoundError("s"));

    const op = ctx.markAsInactive(testInput);

    await expect(op).rejects.toThrowError(NotFoundError);
  });

  test("generic error", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new Error("death"));

    const op = ctx.markAsInactive(testInput);

    await expect(op).rejects.toThrowError(Error);
  });

  test("Sub state is not active or stopped - should return ConflictError", async () => {
    const ctx = createContext();
    const sub = mockSubscription({
      state: faker.random.arrayElement([
        SubscriptionState.CREATED,
        SubscriptionState.CANCELED,
        SubscriptionState.INACTIVE,
        SubscriptionState.ENDED,
      ]),
    });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const op = ctx.markAsInactive(testInput);
    await expect(op).rejects.toThrowError(ConflictError);
  });

  test("should throw Error if update fails", async () => {
    const ctx = createContext();
    const sub = mockSubscription({ state: SubscriptionState.ACTIVE });
    ctx.subRepo.getById.mockResolvedValue(sub);
    ctx.subRepo.update.mockRejectedValueOnce(new Error());

    const op = ctx.markAsInactive(testInput);

    await expect(op).rejects.toThrowError(Error);
  });

  test("should return updated subscription", async () => {
    const ctx = createContext();
    const sub = mockSubscription({
      state: faker.random.arrayElement([
        SubscriptionState.ACTIVE,
        SubscriptionState.STOPPED,
      ]),
    });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const updatedSub = mockSubscription({ state: sub.state });

    ctx.subRepo.update.mockResolvedValue(updatedSub);
    const op = await ctx.markAsInactive(testInput);

    expect(op.state).toEqual(updatedSub.state);
  });
});
