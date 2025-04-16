import { Accounts, Characters } from "../../src/database.ts";
import type { PurchaseSlotResponse } from "../../src/routes/api/purchaseSlot.ts";
import type { SignupResponse } from "../../src/routes/api/signup.ts";
import type { ForbiddenResponse } from "../api.spec.ts";
import type { AuthTokenPayload } from "@adventureland/types";
import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import Config from "config";
import { createSigner } from "fast-jwt";
import { StatusCodes } from "http-status-codes";

const initialSlots = Config.get("centralServer.signup.initial.slots");
const slotCost = Config.get("centralServer.purchaseSlot.cost");
const maxSlots = Config.get("centralServer.purchaseSlot.maxSlots");

test.describe.serial("Purchase Slot Specification", () => {
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

  test("Cannot purchase slots without shells", async ({ request }) => {
    const response = await request.post("/api/purchaseSlot", {
      data: {
        token,
      },
    });

    // Response should be forbidden
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as ForbiddenResponse;
    expect(jsonResponse.error).toBeTruthy();

    // There should not be an additional slot
    const account = await Accounts.findOne({ id: accountId });
    expect(account).toBeTruthy();
    expect(account?.slots).toBe(initialSlots);
  });

  test("Forbidden to buy slot with a bad token", async ({ request }) => {
    // Give the account enough shells to buy one slot
    await Accounts.updateOne({ id: accountId }, { $set: { shells: slotCost } });

    // Create a token with a valid ID, but not signed with the correct key
    const badSigner = createSigner({ key: "badkey" });
    const badPayload: AuthTokenPayload = {
      accountId,
    };
    const badToken = badSigner(badPayload);
    const response = await request.post("/api/purchaseSlot", {
      data: {
        token: badToken,
      },
    });

    // Response should be forbidden
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as ForbiddenResponse;
    expect(jsonResponse.error).toBeTruthy();

    // There should not be an additional slot
    const account = await Accounts.findOne(
      { id: accountId },
      { projection: { shells: 1, slots: 1 } },
    );
    expect(account).toBeTruthy();
    expect(account?.shells).toBe(slotCost);
    expect(account?.slots).toBe(initialSlots);
  });

  test("Successful purchase of slot", async ({ request }) => {
    // Give the account enough shells to buy one slot
    await Accounts.updateOne({ id: accountId }, { $set: { shells: slotCost } });

    const response = await request.post("/api/purchaseSlot", {
      data: {
        token,
      },
    });

    // Response should be OK
    expect(response.status()).toBe(StatusCodes.OK);

    // The number of slots should be accurate
    const jsonResponse = (await response.json()) as PurchaseSlotResponse;
    expect(jsonResponse.numSlots).toBe(initialSlots + 1);

    // We should have deducted the correct number of shells, and have an additional slot
    const account = await Accounts.findOne(
      { id: accountId },
      { projection: { shells: 1, slots: 1 } },
    );
    expect(account).toBeTruthy();
    expect(account?.shells).toBe(0);
    expect(account?.slots).toBe(initialSlots + 1);
  });

  test("Number of slots for purchase is capped", async ({ request }) => {
    // Give the account the maximum number of slots
    await Accounts.updateOne({ id: accountId }, { $set: { slots: maxSlots } });

    const response = await request.post("/api/purchaseSlot", {
      data: {
        token,
      },
    });

    // Response should be forbidden
    expect(response.status()).toBe(StatusCodes.FORBIDDEN);
    const jsonResponse = (await response.json()) as ForbiddenResponse;
    expect(jsonResponse.error).toBeTruthy();
  });
});
