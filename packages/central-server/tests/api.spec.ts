import { test, expect } from "@playwright/test";

test("signup", async ({ request }) => {
  const response = await request.post("/api/signup", {
    data: {
      email: "test@test.com",
      password: "testpassword",
    },
  });

  expect(response.ok()).toBeTruthy();
});
