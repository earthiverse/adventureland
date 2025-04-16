import { Accounts, Characters } from "../../src/database.ts";
import type { SignupResponse } from "../../src/routes/api/signup.ts";
import type { ForbiddenResponse } from "../api.spec.ts";
import type { AuthTokenPayload } from "@adventureland/types";
import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import { createSigner } from "fast-jwt";
import { StatusCodes } from "http-status-codes";

test.describe.serial("Purchase Shells Specification", () => {
  const email = faker.internet.email();
  const password = faker.internet.password();
  let accountId: string; // set in signup
  let token: string; // set in signup

  test.afterAll(async () => {
    await Accounts.deleteMany({ id: accountId });
    await Characters.deleteMany({ accountId });
  });

  test("Successful signup", async ({ request }) => {
    const response = await request.post("/api/signup", {
      data: { email, password },
    });
    expect(response.status()).toBe(StatusCodes.CREATED);
    const jsonResponse = (await response.json()) as SignupResponse;
    accountId = jsonResponse.accountId;
    token = jsonResponse.token;
  });

  test("Forbidden to purchase shells with a bad token", async ({ request }) => {
    // Create a token with a valid ID, but not signed with the correct key
    const badSigner = createSigner({ key: "badkey" });
    const badPayload: AuthTokenPayload = {
      accountId,
    };
    const badToken = badSigner(badPayload);
    const response = await request.post("/api/purchaseShells", {
      data: {
        token: badToken,
        numShells: 800,
      },
    });

    // Response should be forbidden
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as ForbiddenResponse;
    expect(jsonResponse.error).toBeTruthy();

    // There should not be any shells
    const account = await Accounts.findOne(
      { id: accountId },
      { projection: { shells: 1, slots: 1 } },
    );
    expect(account).toBeTruthy();
    expect(account?.shells).toBe(0);
  });

  let sessionUrl: string;
  const numShells = 800;
  test("Successful purchase", async ({ page, request }) => {
    // Start purchase of shells
    const response = await request.post("/api/purchaseShells", {
      data: {
        token,
        numShells,
      },
    });

    expect(response.status()).toBe(StatusCodes.OK); // TODO: Redirect?

    // Open the checkout page
    await page.goto(response.url());

    // Fill out the Stripe form
    await page.locator('input[id="cardNumber"]').fill("4242424242424242");
    await page.locator('input[id="cardExpiry"]').fill("01/42");
    await page.locator('input[id="cardCvc"]').fill("424");
    await page.locator('input[id="billingName"]').fill(faker.person.fullName());
    await page.locator('button[type="submit"]').click();

    // Wait for payment to process
    await page.waitForURL("**/api/verifyPurchaseShells/**");
    sessionUrl = page.url();

    // There should be shells
    const account = await Accounts.findOne(
      { id: accountId },
      { projection: { shells: 1, slots: 1 } },
    );
    expect(account).toBeTruthy();
    expect(account?.shells).toBe(numShells);
  });

  test("Unable to claim shells twice", async ({ request }) => {
    const response = await request.get(sessionUrl);

    expect(response.status()).toBe(StatusCodes.FORBIDDEN);

    // There should be shells
    const account = await Accounts.findOne(
      { id: accountId },
      { projection: { shells: 1, slots: 1 } },
    );
    expect(account).toBeTruthy();
    expect(account?.shells).toBe(numShells);
  });
});
