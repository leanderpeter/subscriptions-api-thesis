import { Functions } from "serverless/aws";

const functions: Functions = {
  "api-root": {
    handler: "src/interfaces/lambda-http/root/main.handler",
    events: [
      {
        http: {
          method: "GET",
          path: "/",
          private: true,
        },
      },
    ],
  },
  "api-health": {
    handler: "src/interfaces/lambda-http/health/main.handler",
    events: [
      {
        http: {
          method: "get",
          path: "/health",
        },
      },
    ],
  },
  "api-get-subscription-by-id": {
    handler: "src/interfaces/lambda-http/subscriptions/get/main.handler",
    events: [
      {
        http: {
          method: "get",
          path: "/subscriptions/{id}",
          private: true,
        },
      },
    ],
  },
  "api-create-subscription": {
    handler: "src/interfaces/lambda-http/subscriptions/post/main.handler",
    timeout: 15,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    alarms: ["sideEffectFailures"],
    events: [
      {
        http: {
          method: "post",
          path: "/subscriptions",
          private: true,
        },
      },
    ],
  },
  "api-transition-subscription-state": {
    handler: "src/interfaces/lambda-http/subscriptions/put-state/main.handler",
    timeout: 15,
    events: [
      {
        http: {
          method: "put",
          path: "/subscriptions/{id}/state",
          private: true,
        },
      },
    ],
  },
  "api-list-possible-state-transitions": {
    handler:
      "src/interfaces/lambda-http/subscriptions/get-possible-state-transitions/main.handler",
    events: [
      {
        http: {
          method: "get",
          path: "/subscriptions/{id}/state_transitions",
          private: true,
        },
      },
    ],
  },
  "api-list-subscriptions": {
    handler:
      "src/interfaces/lambda-http/subscriptions/get-by-filters/main.handler",
    timeout: 15,
    events: [
      {
        http: {
          method: "get",
          path: "/subscriptions",
          private: true,
        },
      },
    ],
  },
};

export default functions;
