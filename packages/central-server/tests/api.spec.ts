import { Accounts } from "../src/database.ts";
import { verifier } from "../src/jwt.ts";
import type { CreateCharacterSchema } from "../src/routes/api/createCharacter.ts";
import type { LoginSchema } from "../src/routes/api/login.ts";
import type { SignupSchema } from "../src/routes/api/signup.ts";
import type { AuthToken, CharacterType } from "@adventureland/types";
import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import type { Static } from "@sinclair/typebox";
import type { FastifyError } from "fastify";
import { StatusCodes } from "http-status-codes";

type SignupResponseCreated = Static<
  (typeof SignupSchema.response)[StatusCodes.CREATED]
>;
type SignupResponseForbidden = Static<
  (typeof SignupSchema.response)[StatusCodes.FORBIDDEN]
>;
type LoginResponseOk = Static<(typeof LoginSchema.response)[StatusCodes.OK]>;
type LoginResponseForbidden = Static<
  (typeof LoginSchema.response)[StatusCodes.FORBIDDEN]
>;
type CreateCharacterResponseCreated = Static<
  (typeof CreateCharacterSchema.response)[StatusCodes.CREATED]
>;

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

    const jsonResponse = (await response.json()) as SignupResponseCreated;
    const token = jsonResponse.token;
    const jwt = verifier(token) as AuthToken;
    expect(jwt).toBeTruthy();
    expect(jwt.accountId).toBeTruthy();
  });

  test("Signing up two accounts with the same email is forbidden", async ({
    request,
  }) => {
    const response = await request.post("/api/signup", {
      data: { email, password: faker.internet.password() },
    });

    // Should be rejected with an error message
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as SignupResponseForbidden;
    expect(jsonResponse.error).toBeTruthy();
  });

  test("Logging in with the wrong password is forbidden", async ({
    request,
  }) => {
    const response = await request.post("/api/login", {
      data: {
        email,
        password: faker.internet.password(), // Don't use the password we used to sign up
      },
    });

    // Should be rejected with an error message
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as LoginResponseForbidden;
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
    const jsonResponse = (await response.json()) as LoginResponseForbidden;
    expect(jsonResponse.error).toBeTruthy();
  });

  test("Logging in with the correct password returns a valid token", async ({
    request,
  }) => {
    const response = await request.post("/api/login", {
      data: { email, password },
    });

    expect(response.status()).toBe(StatusCodes.OK);

    // Token should be valid
    const jsonResponse = (await response.json()) as LoginResponseOk;
    const token = jsonResponse.token;
    const jwt = verifier(token) as AuthToken;
    expect(jwt).toBeTruthy();

    // Token should have the account ID in it
    expect(jwt.accountId).toBeTruthy();

    // Token should expire in the future
    expect(jwt.exp).toBeTruthy();
    expect(jwt.exp).toBeGreaterThan(Date.now() / 1000);
  });
});

const characterTypes: CharacterType[] = [
  "mage",
  "merchant",
  "paladin",
  "priest",
  "ranger",
  "rogue",
  "warrior",
];

test.describe.serial("Signup and Create Character", () => {
  const email = faker.internet.email();
  const password = faker.internet.password();

  test.afterAll(async () => {
    await Accounts.deleteOne({ email });
  });

  let token: string;
  let accountId: string;

  test("Signup is OK", async ({ request }) => {
    const response = await request.post("/api/signup", {
      data: { email, password },
    });

    expect(response.status()).toBe(StatusCodes.CREATED);
    const jsonResponse = (await response.json()) as SignupResponseCreated;
    token = jsonResponse.token;

    // Get account ID
    const jwt = verifier(token) as AuthToken;
    expect(jwt).toBeTruthy();
    accountId = jwt.accountId;
  });

  test("Characters cannot be created without a name", async ({ request }) => {
    const response = await request.post("/api/createCharacter", {
      data: {
        token,
        character: {
          // Missing name
          type: characterTypes[
            Math.floor(Math.random() * characterTypes.length)
          ],
        },
      },
    });

    // Should be rejected with an error message
    expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
    const jsonResponse = (await response.json()) as FastifyError;
    expect(jsonResponse.message).toBeTruthy();

    const response2 = await request.post("/api/createCharacter", {
      data: {
        token,
        character: {
          name: "", // Empty name
          type: characterTypes[
            Math.floor(Math.random() * characterTypes.length)
          ],
        },
      },
    });

    // Should be rejected with an error message
    expect(response2.status()).toBe(StatusCodes.BAD_REQUEST);
    const jsonResponse2 = (await response.json()) as FastifyError;
    expect(jsonResponse2.message).toBeTruthy();
  });

  test("Creating a new character returns new character details", async ({
    request,
  }) => {
    const randomType =
      characterTypes[Math.floor(Math.random() * characterTypes.length)];
    const randomName = faker.helpers.fromRegExp("[a-zA-Z]{4,12}");
    const response = await request.post("/api/createCharacter", {
      data: {
        token,
        character: {
          name: randomName,
          type: randomType,
        },
      },
    });

    // Should be rejected with an error message
    expect(response.status()).toBe(StatusCodes.CREATED);
    const jsonResponse =
      (await response.json()) as CreateCharacterResponseCreated;
    expect(jsonResponse.character).toBeTruthy();
    expect(jsonResponse.character.accountId).toBe(accountId);
    expect(jsonResponse.character.name).toBe(randomName);
    expect(jsonResponse.character.type).toBe(randomType);
  });
});
