import { Accounts } from "../src/database.ts";
import { verifier } from "../src/jwt.ts";
import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import { StatusCodes } from "http-status-codes";

// TODO: Rate limit test w/ 429 StatusCodes.TOO_MANY_REQUESTS

test.describe.serial("signup and login", () => {
  const email = faker.internet.email();
  const password = faker.internet.password();

  test.afterAll(async () => {
    await Accounts.deleteOne({ email });
  });

  test("signup", async ({ request }) => {
    const response = await request.post("/api/signup", {
      data: { email, password },
    });

    expect(response.status()).toBe(StatusCodes.CREATED);

    // Token should be valid, with the email in it
    const token = ((await response.json()) as { token: string }).token;
    const jwt = verifier(token) as { email: string };
    expect(jwt).toBeTruthy();
    expect(jwt.email).toBe(email);
  });

  test("unsuccessful login with valid email", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: {
        email,
        password: faker.internet.password(), // Use a different password
      },
    });

    // Should be rejected with an error message
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as { error: string };
    expect(jsonResponse.error).toBeTruthy();
  });

  test("successful login", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { email, password },
    });

    expect(response.status()).toBe(StatusCodes.OK);

    // Token should be valid, with the email in it
    const token = ((await response.json()) as { token: string }).token;
    const jwt = verifier(token) as { email: string };
    expect(jwt).toBeTruthy();
    expect(jwt.email).toBe(email);
  });
});
