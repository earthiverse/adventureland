import Config from "config";
import { hostname } from "node:os";
import Winston from "winston";
import { Syslog } from "winston-syslog";
import winston from "winston/lib/winston/config/index.js";

const Logger = Winston.createLogger({ levels: winston.syslog.levels });

if (Config.has("logging.syslog")) {
  const syslogOptions = Config.get("logging.syslog");
  Logger.add(new Syslog({ ...syslogOptions, localhost: hostname() }));
}

if (Config.get("logging.console")) {
  Logger.add(
    new Winston.transports.Console({
      level: "debug",
      format: Winston.format.combine(
        Winston.format.colorize(),
        Winston.format.simple(),
      ),
    }),
  );
}

export { Logger };
