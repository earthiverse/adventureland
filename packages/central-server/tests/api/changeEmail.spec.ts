import { Accounts, Characters } from "../../src/database.ts";
import type { ChangeEmailResponse } from "../../src/routes/api/changeEmail.ts";
import type { SignupResponse } from "../../src/routes/api/signup.ts";
import type { ForbiddenResponse } from "../api.spec.ts";
import type { AuthTokenPayload } from "@adventureland/types";
import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import config from "config";
import { createSigner } from "fast-jwt";
import { StatusCodes } from "http-status-codes";

test.describe.serial("Change Email Specification", () => {
  const email = faker.internet.email();
  const password = faker.internet.password();
  let accountId: string; // set in signup
  let token: string; // set in signup
  const characterName = faker.helpers.fromRegExp("[a-zA-Z]{5,12}");
  const newEmail = faker.internet.email();

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

  test("Forbidden to change email before creating a character", async ({
    request,
  }) => {
    const response = await request.post("/api/changeEmail", {
      data: {
        token,
        newEmail: faker.internet.email(),
      },
    });
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as ForbiddenResponse;
    expect(jsonResponse.error).toBeTruthy();

    // Ensure there is no change request for the new email yet
    const account = await Accounts.findOne({ id: accountId });
    expect(account).toBeTruthy();
    expect(account?.email).toBe(email);
    expect(account?.verified).toBeFalsy();
    expect(account?.emailChange).toBeDefined();
    expect(account?.emailChange?.newEmail).toBe(email);
  });

  test("Create character", async ({ request }) => {
    const response = await request.post("/api/createCharacter", {
      data: {
        token,
        character: {
          name: characterName,
          type: "mage",
        },
      },
    });
    expect(response.status()).toBe(StatusCodes.CREATED);
  });

  test("Forbidden to change email with a bad token", async ({ request }) => {
    // Create a token with a valid ID, but not signed with the correct key
    const badSigner = createSigner({ key: "badkey" });
    const badPayload: AuthTokenPayload = {
      accountId,
    };
    const badToken = badSigner(badPayload);
    const response = await request.post("/api/changeEmail", {
      data: {
        token: badToken,
        newEmail: faker.internet.email(),
      },
    });
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as ForbiddenResponse;
    expect(jsonResponse.error).toBeTruthy();

    // Ensure there is no change request for the new email yet
    const account = await Accounts.findOne({ id: accountId });
    expect(account).toBeTruthy();
    expect(account?.email).toBe(email);
    expect(account?.verified).toBeFalsy();
    expect(account?.emailChange).toBeDefined();
    expect(account?.emailChange?.newEmail).toBe(email);
  });

  let verifyCode: string;
  test("Change email", async ({ request }) => {
    const response = await request.post("/api/changeEmail", {
      data: {
        token,
        newEmail,
      },
    });
    expect(response.status()).toBe(StatusCodes.OK);
    const jsonResponse = (await response.json()) as ChangeEmailResponse;
    expect(jsonResponse.newEmail).toBe(newEmail);

    // Get the verifyCode from the email in Mailpit
    const verifyEmailsFetch = await fetch(
      `http://localhost:8025/api/v1/search?query=to:${newEmail}`,
    );
    const verifyEmails = (await verifyEmailsFetch.json()) as {
      messages_count: number;
      messages: { ID: string }[];
    };
    expect(verifyEmails.messages_count).toBe(1);
    const verifyEmailID = verifyEmails.messages[0]?.ID as string;
    expect(verifyEmailID).toBeTruthy();
    const verifyEmailFetch = await fetch(
      `http://localhost:8025/api/v1/message/${verifyEmailID}`,
    );
    const verifyEmail = (await verifyEmailFetch.json()) as { Text: string };
    const verifyCodeRegex = new RegExp(
      `^http.+/(.{${config.get("centralServer.verifyEmail.codeLength")}})$`,
      "m",
    );
    verifyCode = verifyCodeRegex.exec(verifyEmail.Text)?.[1] as string;
    expect(verifyCode).toBeTruthy();

    // Ensure that an email is sent to the old email address to notify the user
    const notifyEmailsFetch = await fetch(
      `http://localhost:8025/api/v1/search?query=to:${email} subject:"email change"`,
    );
    const notifyEmails = (await notifyEmailsFetch.json()) as {
      messages_count: number;
      messages: { ID: string }[];
    };
    expect(notifyEmails.messages_count).toBe(1);
    const notifyEmailID = notifyEmails.messages[0]?.ID as string;
    expect(notifyEmailID).toBeTruthy();
    const notifyEmailFetch = await fetch(
      `http://localhost:8025/api/v1/message/${notifyEmailID}`,
    );
    const notifyEmail = (await notifyEmailFetch.json()) as { Text: string };
    expect(notifyEmail.Text).toContain(newEmail);

    // Ensure that the email is still the old email, but there's a change for the new email now
    const account = await Accounts.findOne({ id: accountId });
    expect(account).toBeTruthy();
    expect(account?.email).toBe(email);
    expect(account?.verified).toBeFalsy();
    expect(account?.emailChange).toBeDefined();
    expect(account?.emailChange?.newEmail).toBe(newEmail);
  });

  test("Verify Email", async ({ request }) => {
    const response = await request.get(`/api/verifyEmail/${verifyCode}`, {
      data: {
        token,
        newEmail,
      },
    });

    expect(response.status()).toBe(StatusCodes.OK);
    const responseText = await response.text();
    expect(responseText).toBeTruthy();

    // Check that the account is verified with the new email
    const account = await Accounts.findOne({ id: accountId });
    expect(account).toBeTruthy();
    expect(account?.email).toBe(newEmail);
    expect(account?.verified).toBeTruthy();
    expect(account?.emailChange).toBeUndefined();
  });
});
