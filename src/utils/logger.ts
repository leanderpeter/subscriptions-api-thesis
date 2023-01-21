import * as winston from "winston";
import VERSION from "~/src/version";

type Entry = Record<string, unknown> & { actor: string };
type ErrorEntry = Entry & { err: string };

const finnFormatter = winston.format((info) => {
  info.time = new Date().toISOString();
  info.v = VERSION;
  return info;
});

export interface Logger {
  debug(msg: string, entries: Entry): void;
  info(msg: string, entries: Entry): void;
  warn(msg: string, entries: Entry): void;
  error(msg: string, entries: ErrorEntry): void;
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(finnFormatter(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV === "test",
    }),
  ],
});

/**
 * Creates and returns a scoped instance of the logger
 * @param scope The scope of the loggger
 * @returns Logger
 */
export default function createLogger(scope: string): Logger {
  return {
    debug(msg: string, entries: Entry): void {
      logger.debug(msg, { ...entries, scope });
    },
    info(msg: string, entries: Entry): void {
      logger.info(msg, { ...entries, scope });
    },
    warn(msg: string, entries: Entry): void {
      logger.warn(msg, { ...entries, scope });
    },
    error(msg: string, entries: ErrorEntry): void {
      logger.error(msg, { ...entries, scope });
    },
  };
}
