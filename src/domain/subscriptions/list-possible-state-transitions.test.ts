import { mockSubscription } from "~/src/mocks/model";
import { mockSubRepository } from "~/src/mocks/repo";
import { NotFoundError } from "~/src/domain/types/errors";
import { listPossibleStateTransitions } from "./list-possible-state-transitions";
import { SubscriptionState } from "~/src/domain/types/subscription";

const testInput = {
  id: "sub-id-123",
  metadata: { requestId: "test-132", actor: "Leander" },
};

function createContext() {
  const subRepo = mockSubRepository();
  return {
    subRepo,
    listPossibleStateTransitions: listPossibleStateTransitions({ subRepo }),
  };
}

describe("List possible state transitions", () => {
  test("should throw error on subscription not found", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValue(new NotFoundError("s"));
    const res = ctx.listPossibleStateTransitions(testInput);
    await expect(res).rejects.toThrowError(Error);
  });

  test("generic error", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new Error("death"));

    const res = ctx.listPossibleStateTransitions(testInput);

    await expect(res).rejects.toThrowError(Error);
  });

  test("should return [canceled, active]", async () => {
    const ctx = createContext();
    const expectedStates = [
      SubscriptionState.CANCELED,
      SubscriptionState.ACTIVE,
    ];
    const sub = mockSubscription({ state: SubscriptionState.CREATED });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const res = await ctx.listPossibleStateTransitions(testInput);
    expect(res).toEqual(expectedStates);
  });

  test("should return [stopped, inactive]", async () => {
    const ctx = createContext();
    const expectedStates = [
      SubscriptionState.STOPPED,
      SubscriptionState.INACTIVE,
    ];
    const sub = mockSubscription({ state: SubscriptionState.ACTIVE });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const res = await ctx.listPossibleStateTransitions(testInput);
    expect(res).toEqual(expectedStates);
  });

  test("should return [ended]", async () => {
    const ctx = createContext();
    const expectedStates = [SubscriptionState.ENDED];
    const sub = mockSubscription({ state: SubscriptionState.INACTIVE });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const res = await ctx.listPossibleStateTransitions(testInput);
    expect(res).toEqual(expectedStates);
  });

  test("should return []", async () => {
    const ctx = createContext();
    const sub = mockSubscription({ state: SubscriptionState.ENDED });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const res = await ctx.listPossibleStateTransitions(testInput);
    expect(res).toEqual([]);
  });
});
