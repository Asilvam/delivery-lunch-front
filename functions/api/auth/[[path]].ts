interface Env {
  BACKEND_ORIGIN?: string;
  VITE_API_BASE_URL?: string;
}
interface Context {
  request: Request;
  env: Env;
}
/** Only the customer auth endpoints use same-origin cookies. Staff API stays unchanged. */
export async function onRequest({ request, env }: Context): Promise<Response> {
  const incoming = new URL(request.url);
  if (
    request.method !== "POST" ||
    !["/api/auth/google", "/api/auth/refresh", "/api/auth/logout"].includes(
      incoming.pathname,
    )
  )
    return new Response("Not found", { status: 404 });
  if (
    request.headers.get("Origin") !== incoming.origin ||
    request.headers.get("X-Customer-Request") !== "1"
  )
    return new Response("Forbidden", { status: 403 });
  const origin = env.BACKEND_ORIGIN || env.VITE_API_BASE_URL;
  if (!origin)
    return new Response("Customer session backend is not configured", {
      status: 503,
    });
  let upstream: URL;
  try {
    upstream = new URL(origin);
  } catch {
    return new Response("Invalid backend origin", { status: 503 });
  }
  if (upstream.protocol !== "https:" || upstream.username || upstream.password)
    return new Response("Invalid backend origin", { status: 503 });
  upstream.pathname = incoming.pathname.replace(/^\/api/, "");
  upstream.search = "";
  const headers = new Headers({
    "Content-Type": "application/json",
    Origin: incoming.origin,
    "X-Customer-Request": "1",
  });
  const cookie = request.headers
    .get("Cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("sa_customer_session="));
  if (cookie) headers.set("Cookie", cookie);
  try {
    const response = await fetch(upstream, {
      method: "POST",
      headers,
      body: await request.arrayBuffer(),
      redirect: "manual",
      signal: AbortSignal.timeout(28000),
    });
    const outgoing = new Headers(response.headers);
    outgoing.set("Cache-Control", "no-store");
    outgoing.delete("Access-Control-Allow-Origin");
    return new Response(response.body, {
      status: response.status,
      headers: outgoing,
    });
  } catch {
    return new Response("Customer session backend is unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
