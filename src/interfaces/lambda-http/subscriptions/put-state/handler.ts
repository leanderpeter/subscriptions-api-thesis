import { APIGatewayProxyHandler } from "aws-lambda";
import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import { MarkAsActive } from "~/src/domain/subscriptions/mark-as-active";
import { MarkAsCanceled } from "~/src/domain/subscriptions/mark-as-canceled";
import { mapError, response, StatusCodes } from "~/src/utils/response";
import { captureEventContext } from "~/src/interfaces/lambda-http/capture-context";
import {
  Subscription,
  SubscriptionState,
} from "~/src/domain/types/subscription";
import { mapSubscription } from "~/src/interfaces/lambda-http/subscriptions/get/handler";
import { MarkAsStopped } from "~/src/domain/subscriptions/mark-as-stopped";
import { MarkAsInactive } from "~/src/domain/subscriptions/mark-as-inactive";
import { MarkAsEnded } from "~/src/domain/subscriptions/mark-as-ended";

export interface Input {
  state: string;
  note?: string;
  termination_reason?: string;
  termination_date?: string;
}

const inputSchema: JSONSchemaType<Input> = {
  type: "object",
  properties: {
    state: {
      type: "string",
      enum: [
        SubscriptionState.ACTIVE,
        SubscriptionState.CANCELED,
        SubscriptionState.STOPPED,
        SubscriptionState.INACTIVE,
        SubscriptionState.ENDED,
      ],
    },
    termination_reason: {
      type: "string",
      minLength: 1,
      maxLength: 300,
      nullable: true,
    },
    termination_date: {
      type: "string",
      format: "iso-date-time",
      nullable: true,
    },
    note: {
      type: "string",
      minLength: 1,
      maxLength: 300,
      nullable: true,
    },
  },
  required: ["state"],
};

const ajv = new Ajv();
addFormats(ajv);
const validateInput = ajv.compile(inputSchema);

export interface Dependencies {
  markAsActive: MarkAsActive;
  markAsCanceled: MarkAsCanceled;
  markAsStopped: MarkAsStopped;
  markAsInactive: MarkAsInactive;
  markAsEnded: MarkAsEnded;
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
    let input: Input;
    try {
      input = JSON.parse(event.body || "") as Input;
    } catch (e) {
      return response(
        StatusCodes.BAD_REQUEST,
        {},
        "body is not a valid json",
        ctx
      );
    }
    if (!validateInput(input)) {
      return response(
        StatusCodes.BAD_REQUEST,
        {
          errors: validateInput.errors,
        },
        "missing/invalid properties",
        ctx
      );
    }
    let sub: Subscription;
    const metadata = { actor: ctx.actor, requestId: ctx.requestId };
    switch (input.state) {
      case SubscriptionState.ACTIVE: {
        try {
          const requestInput = { id, note: input.note, metadata };
          sub = await deps.markAsActive(requestInput);
          return response(StatusCodes.SUCCESS, mapSubscription(sub), "", ctx);
        } catch (err) {
          return mapError(err, ctx);
        }
      }
      case SubscriptionState.CANCELED: {
        if (!input.termination_date || !input.termination_reason) {
          return response(
            StatusCodes.BAD_REQUEST,
            {},
            "missing termination information",
            ctx
          );
        }
        try {
          const requestInput = {
            id,
            terminationReason: input.termination_reason,
            terminationDate: new Date(input.termination_date),
            metadata,
          };
          sub = await deps.markAsCanceled(requestInput);
          return response(StatusCodes.SUCCESS, mapSubscription(sub), "", ctx);
        } catch (err) {
          return mapError(err, ctx);
        }
      }
      case SubscriptionState.STOPPED: {
        if (!input.termination_date || !input.termination_reason) {
          return response(
            StatusCodes.BAD_REQUEST,
            {},
            "missing termination information",
            ctx
          );
        }
        try {
          const requestInput = {
            id,
            terminationReason: input.termination_reason,
            terminationDate: new Date(input.termination_date),
            metadata,
          };
          sub = await deps.markAsStopped(requestInput);
          return response(StatusCodes.SUCCESS, mapSubscription(sub), "", ctx);
        } catch (err) {
          return mapError(err, ctx);
        }
      }
      case SubscriptionState.INACTIVE: {
        try {
          const requestInput = { id, note: input.note, metadata };
          sub = await deps.markAsInactive(requestInput);
          return response(StatusCodes.SUCCESS, mapSubscription(sub), "", ctx);
        } catch (err) {
          return mapError(err, ctx);
        }
      }
      case SubscriptionState.ENDED: {
        try {
          const requestInput = { id, note: input.note, metadata };
          sub = await deps.markAsEnded(requestInput);
          return response(StatusCodes.SUCCESS, mapSubscription(sub), "", ctx);
        } catch (err) {
          return mapError(err, ctx);
        }
      }
      // untestable line. Due to AJV validation we will never end here -
      // still typescript compiler requires a default for switch case
      default: {
        return response(StatusCodes.BAD_REQUEST, {}, "not allowed state", ctx);
      }
    }
  };
}
