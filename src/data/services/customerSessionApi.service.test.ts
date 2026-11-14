import axios from "axios";
import { afterEach, expect, it, vi } from "vitest";
import { restoreCustomerSession } from "./customerSessionApi.service";
afterEach(() => vi.restoreAllMocks());
it("deduplicates refresh calls and sends the same-origin HttpOnly cookie through credentials", async () => {
  let complete!: (value: unknown) => void;
  const post = vi.spyOn(axios, "post").mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const first = restoreCustomerSession();
  const second = restoreCustomerSession();
  expect(first).toBe(second);
  expect(post).toHaveBeenCalledTimes(1);
  complete({ status: 204 });
  expect(await first).toBeNull();
  expect(post).toHaveBeenCalledWith(
    "/api/auth/refresh",
    {},
    expect.objectContaining({
      withCredentials: true,
      headers: { "X-Customer-Request": "1" },
    }),
  );
});
it("fails closed instead of accepting an expired access token from a proxy or stale response", async () => {
  vi.spyOn(axios, "post").mockResolvedValueOnce({
    status: 200,
    data: { access_token: "invalid", customer: { googleId: "user" } },
  });
  await expect(restoreCustomerSession()).rejects.toThrow(
    "No se pudo validar la sesión",
  );
});
