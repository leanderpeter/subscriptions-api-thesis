import createLogger from "~/src/utils/logger";

export function getValueFromEnv(name: string): string {
  const logger = createLogger("system");
  const value = process.env[name];
  if (!value) {
    logger.error("invalid configuration", {
      name,
      actor: "aws",
      err: "variable not found",
    });
    throw new Error("missing env variable");
  }
  return value;
}
