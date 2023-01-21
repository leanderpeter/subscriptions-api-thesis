import { mockSubscription } from "~/src/mocks/model";
import { mockCustomerRepository, mockSubRepository } from "~/src/mocks/repo";
import { NotFoundError } from "~/src/domain/types/errors";
import { getById } from "~/src/domain/subscriptions/get-by-id";

function createContext() {
  const subRepo = mockSubRepository();
  const customerRepo = mockCustomerRepository();
  return {
    subRepo,
    customerRepo,
    getById: getById({
      subRepo,
      customerRepo,
    }),
  };
}

describe("Get by Id", () => {
  test("should throw NoFoundError when subscription not found", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new NotFoundError("s"));

    const op = ctx.getById({
      id: "123",
      metadata: { actor: "test", requestId: "test" },
    });

    await expect(op).rejects.toThrowError(NotFoundError);
  });

  test("should throw an error when repository fails for unknown reason", async () => {
    const ctx = createContext();
    ctx.subRepo.getById.mockRejectedValueOnce(new Error("death"));

    const op = ctx.getById({
      id: "123",
      metadata: { actor: "test", requestId: "test" },
    });

    await expect(op).rejects.toThrowError(Error);
  });

  test("should fetch and return a subscription", async () => {
    const ctx = createContext();
    const sub = mockSubscription();
    ctx.subRepo.getById.mockResolvedValueOnce(sub);

    const res = await ctx.getById({
      id: "123",
      metadata: { actor: "test", requestId: "test" },
    });

    expect(res).toEqual(sub);
    expect(ctx.subRepo.getById).toHaveBeenCalledWith("123");
    expect(ctx.customerRepo.getById).not.toHaveBeenCalled();
  });
});
