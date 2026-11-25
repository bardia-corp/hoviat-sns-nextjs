import test from "node:test";
import assert from "node:assert/strict";
import { businessMap } from "../lib/business-map.ts";

const empty = { google_maps_url: null, latitude: null, longitude: null, address: null, postal_code: null, city: null, state: null, country_code: null };

test("no preview for missing location or a lone unresolved short link", () => {
  assert.deepEqual(businessMap(empty), { href: null, embedSrc: null });
  const url = "https://maps.app.goo.gl/unknown";
  assert.deepEqual(businessMap({ ...empty, google_maps_url: url }), { href: url, embedSrc: null });
  assert.equal(businessMap({ ...empty, city: "Berlin" }).embedSrc, null);
});

test("search links become map embeds without loading the sharing page", () => {
  const url = "https://www.google.com/maps/search/?api=1&query=Maybachstra%C3%9Fe+52%2C+N%C3%BCrnberg";
  const map = businessMap({ ...empty, google_maps_url: url });
  assert.equal(map.href, url);
  const embed = new URL(map.embedSrc);
  assert.equal(embed.origin, "https://www.google.com");
  assert.equal(embed.searchParams.get("output"), "embed");
  assert.equal(embed.searchParams.get("q"), "Maybachstraße 52, Nürnberg");
});

test("short links use the supplied address as preview fallback without expanding the link", () => {
  const map = businessMap({ ...empty, google_maps_url: "https://maps.app.goo.gl/example", address: "Example 4", postal_code: "90403", city: "Nürnberg", country_code: "DE" });
  assert.equal(new URL(map.embedSrc).searchParams.get("q"), "Example 4, 90403, Nürnberg, DE");
  assert.equal(map.href, "https://maps.app.goo.gl/example");
});

test("coordinates are range checked and zero is a valid value", () => {
  assert.equal(new URL(businessMap({ ...empty, latitude: 0, longitude: 0 }).embedSrc).searchParams.get("q"), "0,0");
  for (const [latitude, longitude] of [[91, 0], [0, -181], [NaN, 0], [0, Infinity], [0, null]]) {
    assert.equal(businessMap({ ...empty, latitude, longitude }).embedSrc, null);
  }
});

test("untrusted, malformed and non-map URLs are not embedded or linked", () => {
  for (const url of ["javascript:alert(1)", "https://evil.example/maps", "https://google.com.evil.example/maps", "https://user:password@google.com/maps", "http://google.com/maps", "https://google.com:444/maps", "https://www.google.com/search?q=test", "not a URL"]) {
    assert.deepEqual(businessMap({ ...empty, google_maps_url: url }), { href: null, embedSrc: null });
  }
});

test("a proper Google Share embed keeps its data but strips unrelated parameters", () => {
  const map = businessMap({ ...empty, google_maps_url: "https://www.google.com/maps/embed?pb=!1m18!2m3&other=ignored" });
  assert.equal(new URL(map.embedSrc).searchParams.get("pb"), "!1m18!2m3");
  assert.equal(new URL(map.embedSrc).searchParams.has("other"), false);
});
