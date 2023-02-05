import { Functions, Vpc } from "serverless/aws";

function csvArray(v?: string): string[] {
  return v?.split(",") ?? [];
}

const vpc: Vpc = {
  securityGroupIds: csvArray(process.env.SUBSCRIPTIONS_VPC_SECURITY_GROUP_IDS),
  subnetIds: csvArray(process.env.SUBSCRIPTIONS_VPC_SUBNET_IDS),
};

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
    vpc,
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
    vpc,
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
    timeout: 20,
    vpc,
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
    timeout: 20,
    vpc,
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
    vpc,
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
    vpc,
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
  "db-migrate": {
    handler: "src/interfaces/lambda-postgres/apply-migrations/main.handler",
    vpc,
  },
};

export default functions;
