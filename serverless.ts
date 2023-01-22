import type { Serverless } from "serverless/aws";

// Functions
import functions from "./resources/functions";

const serverlessConfiguration: Serverless = {
  frameworkVersion: "3",
  service: "subscriptions",
  custom: {
    serverlessPluginTypescript: {
      tsConfigFileLocation: "./tsconfig.json",
    },
    "serverless-offline": {
      httpPort: 8000,
      lambdaPort: 8002,
      noPrependStageInUrl: true,
      apiKey: "test-local-api-key",
    },
    // customDomain: {
    //   domainName: process.env.SUBSCRIPTIONS_DOMAIN,
    // },
  },
  plugins: [
    "serverless-plugin-typescript",
    "serverless-tscpaths",
    "serverless-offline",
    "serverless-domain-manager",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    apiGateway: {
      shouldStartNameWithService: true,
      minimumCompressionSize: 1024,
      apiKeys: ["${self:provider.stage}-subscriptions"],
    },
    region: '${opt:region, "eu-central-1"}',
    endpointType: "regional",
    stage: '${opt:stage, "development"}',
    versionFunctions: false,
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      REGION: "${self:provider.region}",
      STAGE: "${self:provider.stage}",
      CORRELATION_ID_HEADER_NAME: "${env:CORRELATION_ID_HEADER_NAME}",
      SUBSCRIPTIONS_DATABASE_URL: "${env:SUBSCRIPTIONS_DATABASE_URL}",
      CARS_SERVICE_BASE_URL: "${env:CARS_SERVICE_BASE_URL}",
      CARS_SERVICE_API_KEY: "${env:CARS_SERVICE_API_KEY}",
      CUSTOMERS_SERVICE_BASE_URL: "${env:CUSTOMERS_SERVICE_BASE_URL}",
      CUSTOMERS_SERVICE_API_KEY: "${env:CUSTOMERS_SERVICE_API_KEY}",
    },
  },
  functions,
  useDotenv: true,
};

module.exports = serverlessConfiguration;
