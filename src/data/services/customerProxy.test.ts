import { afterEach, expect, it, vi } from "vitest";
import { onRequest } from "../../../functions/api/auth/[[path]]";
const url = "https://sabores.serviciosasm.cl";
const request = (path = "/refresh", origin = url) =>
  new Request(`${url}/api/auth${path}`, {
    method: "POST",
    headers: {
      Origin: origin,
      "X-Customer-Request": "1",
      Cookie: "staff_secret=hidden; sa_customer_session=opaque",
      Authorization: "Bearer should-not-forward",
    },
    body: "{}",
  });
afterEach(() => vi.unstubAllGlobals());
it("preserves the auth cookie while forwarding only customer credentials to a configured backend", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response("{}", {
        headers: {
          "Set-Cookie":
            "sa_customer_session=opaque; Path=/api/auth; HttpOnly; Secure; SameSite=Lax",
        },
      }),
    );
  vi.stubGlobal("fetch", fetch);
  const response = await onRequest({
    request: request(),
    env: { BACKEND_ORIGIN: "https://backend.example" },
  });
  const [target, options] = fetch.mock.calls[0] as [URL, RequestInit];
  expect(target.toString()).toBe("https://backend.example/auth/refresh");
  const headers = options.headers as Headers;
  expect(headers.get("Cookie")).toBe("sa_customer_session=opaque");
  expect(headers.has("Authorization")).toBe(false);
  expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});
it("rejects cross-origin calls, arbitrary paths and missing backend configuration without fetching", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  expect(
    (
      await onRequest({
        request: request("/refresh", "https://untrusted.example"),
        env: {},
      })
    ).status,
  ).toBe(403);
  expect(
    (await onRequest({ request: request("/../orders"), env: {} })).status,
  ).toBe(404);
  expect((await onRequest({ request: request(), env: {} })).status).toBe(503);
  expect(fetch).not.toHaveBeenCalled();
});
