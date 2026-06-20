const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });
const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  transform: { "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }] },
};
module.exports = createJestConfig(config);