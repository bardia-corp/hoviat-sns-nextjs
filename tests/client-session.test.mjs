import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { apiFetch, SESSION_EXPIRED_EVENT } from "../lib/client-session.ts";

let events;
beforeEach(() => {
  globalThis.window = new EventTarget();
  window.location = { pathname: "/profile", search: "" };
  events = 0;
  window.addEventListener(SESSION_EXPIRED_EVENT, () => events++);
});

test("401 clears client authentication even when the response is not JSON", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("Unauthorized", { status: 401 }));
  assert.equal((await apiFetch("/api/account")).signedIn, false);
  assert.equal(events, 1);
});

test("an explicit signed-out verdict ends the session", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ signedIn: false, ok: true }));
  assert.equal((await apiFetch("/api/session")).signedIn, false);
  assert.equal(events, 1);
});

test("non-JSON permission, rate-limit and server errors do not log out the user", async (t) => {
  for (const status of [403, 429, 500, 502, 503]) {
    const mock = t.mock.method(globalThis, "fetch", async () => new Response("Error", { status }));
    const result = await apiFetch("/api/account");
    assert.equal(result.ok, false);
    assert.equal(result.signedIn, true);
    mock.mock.restore();
  }
  assert.equal(events, 0);
});

test("offline is not a session rejection", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("offline"); });
  const result = await apiFetch("/api/account");
  assert.equal(result.status, 0);
  assert.equal(result.signedIn, true);
  assert.equal(events, 0);
});
