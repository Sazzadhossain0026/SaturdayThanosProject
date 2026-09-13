import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const BASE_URL = `http://localhost:${PORT}`;

// Fixed, known secrets for the test run — never real Stripe/Twilio
// credentials (there are none), but the same *shape* Twilio's docs call
// "test credentials": stable values the suite can sign requests with and
// assert against, without touching a real account.
export const TEST_ENV = {
  APP_BASE_URL: BASE_URL,
  STRIPE_WEBHOOK_SECRET: "whsec_test_playwright",
  TWILIO_ACCOUNT_SID: "ACtest0000000000000000000000000000",
  TWILIO_AUTH_TOKEN: "test_auth_token_playwright",
  TWILIO_FROM_NUMBER: "+15550123456",
  DEMO_RESET_SECRET: "playwright-demo-reset",
  NEXT_PUBLIC_DEMO_RESET_KEY: "playwright-demo-reset",
};

export default defineConfig({
  testDir: "./tests",
  // The whole suite shares one dev server + one SQLite file, and several
  // tests (race-conditions.spec.ts especially) depend on having the DB to
  // themselves — running everything in one worker, in file order, is
  // simpler and more honest than fighting for isolation across workers.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    // Always start fresh: the webhook/SMS signature tests sign requests
    // with TEST_ENV's secrets, which only match a server that was booted
    // with this exact env — reusing some other already-running dev server
    // here would make every signature check fail for a confusing reason.
    reuseExistingServer: false,
    timeout: 60_000,
    env: TEST_ENV,
  },
});
