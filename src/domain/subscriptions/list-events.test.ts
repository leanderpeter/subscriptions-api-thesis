import { mockSubscriptionEvent } from "~/src/mocks/model";
import { mockSubRepository } from "~/src/mocks/repo";
import {
  SortOrder,
  SubscriptionEventName,
} from "~/src/domain/types/subscription";
import { listEventsByFilter } from "./list-events";

function createContext() {
  const subRepo = mockSubRepository();
  return {
    subRepo,
    listEventsByFilter: listEventsByFilter({ subRepo }),
  };
}

const testInput = {
  filters: {
    subscriptionId: ["sub-id-123"],
    name: [SubscriptionEventName.SUBSCRIPTION_CREATED],
    from: new Date(),
  },
  count: 50,
  sortOrder: SortOrder.ASCENDING,
  metadata: { requestId: "test-132", actor: "Leander" },
};

describe("List events by filters", () => {
  test("generic error", async () => {
    const ctx = createContext();
    ctx.subRepo.listEvents.mockRejectedValueOnce(new Error("death"));

    const op = ctx.listEventsByFilter(testInput);

    await expect(op).rejects.toThrowError(Error);
  });

  test("success", async () => {
    const ctx = createContext();
    const events = [
      mockSubscriptionEvent(),
      mockSubscriptionEvent(),
      mockSubscriptionEvent(),
    ];
    ctx.subRepo.listEvents.mockResolvedValueOnce(events);

    const res = await ctx.listEventsByFilter(testInput);

    expect(res).toEqual(events);
    expect(ctx.subRepo.listEvents).toHaveBeenCalledWith(
      testInput.filters,
      testInput.count,
      testInput.sortOrder
    );
  });
});
