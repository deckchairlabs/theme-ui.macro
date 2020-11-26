module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testPathIgnorePatterns: ["/node_modules/", "/examples/"],
  modulePathIgnorePatterns: ["<rootDir>/tests/generated/"]
};