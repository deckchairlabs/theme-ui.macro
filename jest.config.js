module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  modulePathIgnorePatterns: ["<rootDir>/tests/generated/"]
};