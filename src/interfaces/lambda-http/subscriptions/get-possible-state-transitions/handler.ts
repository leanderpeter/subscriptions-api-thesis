import { APIGatewayProxyHandler } from "aws-lambda";
import { ListPossibleStateTransitions } from "~/src/domain/subscriptions/list-possible-state-transitions";
import { mapError, response, StatusCodes } from "~/src/utils/response";
import { captureEventContext } from "~/src/interfaces/lambda-http/capture-context";

export interface Dependencies {
  listPossibleStateTransitions: ListPossibleStateTransitions;
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
        "header x-finn-actor is required",
        ctx
      );
    }
    try {
      const possibleStates = await deps.listPossibleStateTransitions({
        id: id,
        metadata: { actor: ctx.actor, requestId: ctx.requestId },
      });
      return response(StatusCodes.SUCCESS, possibleStates, "", ctx);
    } catch (err) {
      return mapError(err, ctx);
    }
  };
}
