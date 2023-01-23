import { APIGatewayProxyHandler } from "aws-lambda";
import { GetById } from "~/src/domain/subscriptions/get-by-id";
import { Subscription } from "~/src/domain/types/subscription";
import { mapError, response, StatusCodes } from "~/src/utils/response";
import { captureEventContext } from "~/src/interfaces/lambda-http/capture-context";

export interface Dependencies {
  getById: GetById;
}

export function mapSubscription(sub: Subscription): Record<string, unknown> {
  return {
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
  };
}

export default function createHandler(
  deps: Dependencies
): APIGatewayProxyHandler {
  return async (event, context) => {
    const ctx = captureEventContext(event.headers, context);
    const id = event.pathParameters?.id;
    if (!id) {
      return response(StatusCodes.BAD_REQUEST, {}, "missing id", ctx);
    }
    if (!ctx.actor) {
      return response(
        StatusCodes.BAD_REQUEST,
        {},
        "header x-actor is required",
        ctx
      );
    }

    try {
      const sub = await deps.getById({ id, metadata: ctx });
      return response(StatusCodes.SUCCESS, mapSubscription(sub), "", ctx);
    } catch (err) {
      return mapError(err, ctx);
    }
  };
}
