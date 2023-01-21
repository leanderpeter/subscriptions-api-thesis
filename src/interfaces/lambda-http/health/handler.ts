import { APIGatewayProxyHandler } from "aws-lambda";
import createHealthcheck, {
  Dependencies,
} from "~/src/domain/system/healthcheck";
import { response, StatusCodes } from "~/src/utils/response";

export default function createHandler(
  deps: Dependencies
): APIGatewayProxyHandler {
  return async () => {
    let statusCode = StatusCodes.SUCCESS;
    const healthcheck = createHealthcheck(deps);
    const data = await healthcheck();
    if (Object.values(data).some((value) => value === "fail")) {
      statusCode = StatusCodes.ERROR;
    }
    return response(statusCode, data);
  };
}

export { Dependencies };
