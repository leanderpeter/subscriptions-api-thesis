import { mockSubscription } from "~/src/mocks/model";
import { mockCustomerRepository, mockSubRepository } from "~/src/mocks/repo";
import { listSubscriptions } from "~/src/domain/subscriptions/list";
import {
  ListSubscriptionFilters,
  SubscriptionState,
  SubscriptionType,
} from "~/src/domain/types/subscription";

function createContext() {
  const subRepo = mockSubRepository();
  const customerRepo = mockCustomerRepository();
  return {
    subRepo,
    customerRepo,
    listSubscriptions: listSubscriptions({
      subRepo,
    }),
  };
}

const testFilter: ListSubscriptionFilters = {
  carId: ["tesla-model3-922-midnightsilvermetallic"],
  state: [SubscriptionState.ACTIVE],
  contactId: ["testCustomer1"],
};

describe("Get by Filters", () => {
  test("generic error", async () => {
    const ctx = createContext();
    ctx.subRepo.list.mockRejectedValueOnce(new Error("death"));

    const op = ctx.listSubscriptions({
      filters: testFilter,
      count: 10,
      offset: 1,
      metadata: { requestId: "test-132", actor: "Leander" },
    });

    await expect(op).rejects.toThrowError(Error);
  });

  test("should list subscriptions", async () => {
    const ctx = createContext();
    const sub = [mockSubscription()];
    ctx.subRepo.list.mockResolvedValueOnce(sub);

    const res = await ctx.listSubscriptions({
      filters: testFilter,
      count: 10,
      offset: 1,
      metadata: { requestId: "test-132", actor: "Leander" },
    });

    expect(res).toEqual(sub);
    expect(ctx.subRepo.list).toHaveBeenCalledWith(testFilter, 10, 1);
  });

  test("should list B2C/MiniB2B subscriptions", async () => {
    const ctx = createContext();
    const sub1 = mockSubscription({ type: SubscriptionType.B2C });
    const sub2 = mockSubscription({ type: SubscriptionType.MINIB2B });
    const subList = [sub1, sub2];
    ctx.subRepo.list.mockResolvedValueOnce(subList);

    const res = await ctx.listSubscriptions({
      filters: testFilter,
      count: 10,
      offset: 1,
      metadata: { requestId: "test-132", actor: "Wallace Wells" },
    });

    expect(res).toEqual([sub1, sub2]);
    expect(ctx.subRepo.list).toHaveBeenCalledWith(testFilter, 10, 1);
  });

  test("should list B2B subscriptions", async () => {
    const ctx = createContext();
    const sub1 = mockSubscription({ type: SubscriptionType.B2B });
    const subList = [sub1];
    ctx.subRepo.list.mockResolvedValueOnce(subList);

    const res = await ctx.listSubscriptions({
      filters: testFilter,
      count: 10,
      offset: 1,
      metadata: { requestId: "test-132", actor: "Ramona Flowers" },
    });

    expect(res).toEqual([sub1]);
    expect(ctx.subRepo.list).toHaveBeenCalledWith(testFilter, 10, 1);
  });

  test("should list subscriptions", async () => {
    const ctx = createContext();
    const sub1 = mockSubscription({ contactId: "123" });
    const subList = [sub1];
    ctx.subRepo.list.mockResolvedValueOnce(subList);

    const res = await ctx.listSubscriptions({
      filters: testFilter,
      count: 10,
      offset: 1,
      metadata: { requestId: "test-132", actor: "Ramona Flowers" },
    });

    expect(res).toEqual([sub1]);
    expect(ctx.subRepo.list).toHaveBeenCalledWith(testFilter, 10, 1);
  });
});
