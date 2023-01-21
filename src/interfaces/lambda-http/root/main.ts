import { APIGatewayProxyHandler } from "aws-lambda";
import { response, StatusCodes } from "~/src/utils/response";

export const handler: APIGatewayProxyHandler = async () => {
  return Promise.resolve(response(StatusCodes.SUCCESS, { ok: true }));
};
