import { readdirSync } from "fs";
import path from "path";
import * as migrations from "./migrations";

describe("migrations tests", () => {
  const filesNames = readdirSync(path.join(__dirname, "./migrations")).filter(
    (x) => !x.includes("index")
  );

  filesNames.forEach((fileName) => {
    test(`${fileName} to be exported`, () => {
      const file = fileName.split(".ts")[0];

      expect(migrations).toHaveProperty(`migration_${file}`);
    });
  });
});
