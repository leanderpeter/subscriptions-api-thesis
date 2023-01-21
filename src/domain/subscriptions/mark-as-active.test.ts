import { mockSubRepository } from "~/src/mocks/repo";
import { mockSubscription } from "~/src/mocks/model";
import { markAsActive } from "~/src/domain/subscriptions/mark-as-active";
import { ConflictError, NotFoundError } from "~/src/domain/types/errors";
import {
  SubscriptionState,
  SubscriptionTermType,
  SubscriptionType,
} from "~/src/domain/types/subscription";

function createContext() {
  const subRepo = mockSubRepository();
  return {
    subRepo,
    markAsActive: markAsActive({
      subRepo,
    }),
  };
}

const testInput = {
  id: "sub-id-123",
  note: "LGTM",
  metadata: { requestId: "test-132", actor: "Mr P" },
};

describe("Mark subscription as active", () => {
  test("not found", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new NotFoundError("s"));

    const op = ctx.markAsActive(testInput);

    await expect(op).rejects.toThrowError(NotFoundError);
  });

  test("generic error", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new Error("death"));

    const op = ctx.markAsActive(testInput);

    await expect(op).rejects.toThrowError(Error);
  });

  test("not in state created - should return ConflictError", async () => {
    const ctx = createContext();
    const sub = mockSubscription({
      id: testInput.id,
      state: SubscriptionState.ACTIVE,
    });
    ctx.subRepo.getById.mockResolvedValue(sub);

    const op = ctx.markAsActive(testInput);
    await expect(op).rejects.toThrow(ConflictError);
  });

  test("updating subscription failed - should throw an Error", async () => {
    const ctx = createContext();
    const sub = mockSubscription({
      id: testInput.id,
      type: SubscriptionType.B2C,
      state: SubscriptionState.CREATED,
    });
    ctx.subRepo.getById.mockResolvedValue(sub);

    ctx.subRepo.update.mockRejectedValueOnce(new Error());

    const op = ctx.markAsActive(testInput);

    await expect(op).rejects.toThrowError(Error);
  });

  test("success - should return updated FIXED term subscription", async () => {
    const ctx = createContext();
    const sub = mockSubscription({
      id: testInput.id,
      type: SubscriptionType.B2C,
      state: SubscriptionState.CREATED,
      termType: SubscriptionTermType.FIXED,
    });
    ctx.subRepo.getById.mockResolvedValue(sub);
    const updatedSub = mockSubscription({
      state: SubscriptionState.ACTIVE,
      type: SubscriptionType.B2C,
      id: testInput.id,
    });
    ctx.subRepo.update.mockResolvedValue(updatedSub);

    const op = await ctx.markAsActive(testInput);

    expect(op.state).toEqual(updatedSub.state);
  });

  test("success - should return updated OPEN_ENDED term subscription", async () => {
    const ctx = createContext();
    const sub = mockSubscription({
      id: testInput.id,
      type: SubscriptionType.B2C,
      state: SubscriptionState.CREATED,
      termType: SubscriptionTermType.OPEN_ENDED,
    });
    ctx.subRepo.getById.mockResolvedValue(sub);
    const updatedSub = mockSubscription({
      state: SubscriptionState.ACTIVE,
      type: SubscriptionType.B2C,
      id: testInput.id,
    });
    ctx.subRepo.update.mockResolvedValue(updatedSub);

    const op = await ctx.markAsActive(testInput);

    expect(op.state).toEqual(updatedSub.state);
  });

  test("should use the default payment repo for B2C", async () => {
    const ctx = createContext();
    const sub = mockSubscription({
      id: testInput.id,
      type: SubscriptionType.B2C,
      state: SubscriptionState.CREATED,
    });
    ctx.subRepo.getById.mockResolvedValueOnce(sub);
    const updatedSub = mockSubscription({
      state: SubscriptionState.ACTIVE,
      type: SubscriptionType.B2C,
      id: testInput.id,
    });
    ctx.subRepo.update.mockResolvedValue(updatedSub);
    await ctx.markAsActive({ id: testInput.id, metadata: testInput.metadata });
  });

  test("should use the default payment repo for MINIB2B", async () => {
    const ctx = createContext();
    const sub = mockSubscription({
      id: testInput.id,
      type: SubscriptionType.MINIB2B,
      state: SubscriptionState.CREATED,
    });
    ctx.subRepo.getById.mockResolvedValueOnce(sub);
    const updatedSub = mockSubscription({
      state: SubscriptionState.ACTIVE,
      type: SubscriptionType.MINIB2B,
      id: testInput.id,
    });
    ctx.subRepo.update.mockResolvedValue(updatedSub);

    await ctx.markAsActive({ id: testInput.id, metadata: testInput.metadata });
  });

  test("success", async () => {
    const ctx = createContext();
    const sub = mockSubscription({
      id: testInput.id,
      type: SubscriptionType.B2C,
      state: SubscriptionState.CREATED,
    });
    ctx.subRepo.getById.mockResolvedValue(sub);
    const updatedSub = mockSubscription({
      state: SubscriptionState.ACTIVE,
      type: SubscriptionType.B2C,
      id: testInput.id,
    });
    ctx.subRepo.update.mockResolvedValue(updatedSub);
    const op = await ctx.markAsActive(testInput);

    expect(op.state).toEqual(updatedSub.state);
  });
});
