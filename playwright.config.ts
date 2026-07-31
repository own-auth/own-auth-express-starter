import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3200";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/integration/**/*.spec.ts", "**/e2e/**/*.spec.ts"],
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev",
    env: {
      DATABASE_URL: "postgres://unused:unused@127.0.0.1:1/unused",
      OWN_AUTH_APP_URL: baseURL,
      OWN_AUTH_TEST_MODE: "1",
      OWN_AUTH_TOKEN_PEPPER:
        "express-starter-test-pepper-that-is-never-used-in-production",
      PORT: "3201",
      VITE_PORT: "3200"
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL
  }
});
