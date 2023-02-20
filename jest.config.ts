import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: false,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/postgres/migrations/"],
  coverageReporters: ["text-summary", "html", "cobertura", "text"],
  // For supporting absoulute imports
  moduleNameMapper: {
    "~/(.*)$": "<rootDir>/$1",
  },
};

export default config;
