import { Accounts } from "../src/database.ts";
import { verifier } from "../src/jwt.ts";
import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import { StatusCodes } from "http-status-codes";

test.describe.serial("Signup and Login", () => {
  const email = faker.internet.email();
  const password = faker.internet.password();

  test.afterAll(async () => {
    await Accounts.deleteOne({ email });
  });

  test("Signup is OK", async ({ request }) => {
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

  test("Signing up two accounts with the same email is forbidden", async ({
    request,
  }) => {
    const response = await request.post("/api/signup", {
      data: { email, password: faker.internet.password() },
    });

    // Should be rejected with an error message
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as { error: string };
    expect(jsonResponse.error).toBeTruthy();
  });

  test("Logging in with the wrong password is forbidden", async ({
    request,
  }) => {
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

  test("Passwords aren't trimmed for whitespace", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: {
        email,
        password: `${password} `,
      },
    });

    // Should be rejected with an error message
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as { error: string };
    expect(jsonResponse.error).toBeTruthy();
  });

  test("Logging in with the correct password is OK", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { email, password },
    });

    expect(response.status()).toBe(StatusCodes.OK);
  });

  test("Logging in with the correct password returns a valid token", async ({
    request,
  }) => {
    const response = await request.post("/api/login", {
      data: { email, password },
    });

    // Token should be valid, with the email in it
    const token = ((await response.json()) as { token: string }).token;
    const jwt = verifier(token) as { email: string };
    expect(jwt).toBeTruthy();
    expect(jwt.email).toBe(email);
  });
});
