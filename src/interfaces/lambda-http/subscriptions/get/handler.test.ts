import { NotFoundError } from "~/src/domain/types/errors";
import { mockSubscription } from "~/src/mocks/model";
import { invoke } from "~/src/utils/test-utils";
import createHandler, {
  mapSubscription,
} from "~/src/interfaces/lambda-http/subscriptions/get/handler";

function createContext() {
  const getById = jest.fn();
  return {
    getById,
    handler: createHandler({ getById }),
  };
}

describe("GET /subscriptions/{id}", () => {
  test("missing id should return 400", async () => {
    const ctx = createContext();

    const res = await invoke(ctx.handler, {
      pathParameters: {
        id: undefined,
      },
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "missing id",
      })
    );
  });

  test("missing actor should return 400", async () => {
    const ctx = createContext();

    const res = await invoke(ctx.handler, {
      pathParameters: {
        id: "123",
      },
      headers: {},
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "header x-finn-actor is required",
      })
    );
  });

  test("should return 500 on unhandled error", async () => {
    const ctx = createContext();
    ctx.getById.mockRejectedValueOnce(new Error("dead"));

    const res = await invoke(ctx.handler, {
      pathParameters: {
        id: "123",
      },
      headers: {
        "x-finn-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "something went wrong",
      })
    );
  });

  test("should return 404 on not found error", async () => {
    const ctx = createContext();
    ctx.getById.mockRejectedValueOnce(new NotFoundError("sub"));

    const res = await invoke(ctx.handler, {
      pathParameters: {
        id: "123",
      },
      headers: {
        "x-finn-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "sub was not found",
      })
    );
  });

  test("should return 200 with subscription data on success", async () => {
    const ctx = createContext();
    const sub = mockSubscription({});
    ctx.getById.mockResolvedValueOnce(sub);

    const res = await invoke(ctx.handler, {
      pathParameters: {
        id: "123",
      },
      headers: {
        "x-finn-actor": "test-actor",
        "x-finn-request-id": "test-request",
      },
    });

    expect(ctx.getById).toHaveBeenCalledWith({
      id: "123",
      metadata: {
        actor: "test-actor",
        requestId: "test-request",
      },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: mapSubscription(sub),
        message: "",
      })
    );
  });

  test("should return 200 with subscription data on success", async () => {
    const ctx = createContext();
    const sub = mockSubscription({});
    ctx.getById.mockResolvedValueOnce(sub);

    const res = await invoke(ctx.handler, {
      pathParameters: {
        id: "123",
      },
      headers: {
        "x-finn-actor": "test-actor",
        "x-finn-request-id": "test-request",
      },
    });

    expect(ctx.getById).toHaveBeenCalledWith({
      id: "123",
      metadata: {
        actor: "test-actor",
        requestId: "test-request",
      },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: mapSubscription(sub),
        message: "",
      })
    );
  });
});

describe("mapSubscription", () => {
  test("should correctly transform Subscription to HTTP format", () => {
    const sub = mockSubscription({});
    const httpSub = mapSubscription(sub);
    expect(httpSub).toStrictEqual({
      id: sub.id,
      state: sub.state,
      contact_id: sub.contactId,
      car_id: sub.carId,
      type: sub.type,
      term: sub.term,
      signing_date: sub.signingDate,
      term_type: sub.termType,
      deposit: sub.deposit,
      amount: sub.amount,
      mileage_package: sub.mileagePackage,
      mileage_package_fee: sub.mileagePackageFee,
      additional_mileage_fee: sub.additionalMileageFee,
      handover_firstname: sub.handoverFirstName,
      handover_lastname: sub.handoverLastName,
      handover_housenumber: sub.handoverHouseNumber,
      handover_street: sub.handoverStreet,
      handover_city: sub.handoverCity,
      handover_zip: sub.handoverZip,
      handover_address_extra: sub.handoverAddressExtra,
      preferred_handover_date: sub.preferredHandoverDate,
      termination_date: sub.terminationDate,
      termination_reason: sub.terminationReason,
      created_at: sub.createdAt,
      updated_at: sub.updatedAt,
    });
  });
});
