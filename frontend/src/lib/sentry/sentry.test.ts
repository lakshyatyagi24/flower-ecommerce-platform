// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { REDACTED, isExpectedClientError, redactString, scrubEvent, stripQuery } from "./scrub";
import { buildOptions } from "./options";

const initServerSentry = vi.fn();
vi.mock("./server", () => ({ initServerSentry: (...a: unknown[]) => initServerSentry(...a) }));

describe("instrumentation register()", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
    initServerSentry.mockClear();
  });

  it("does nothing without a DSN (SDK never initialised)", async () => {
    delete process.env.SENTRY_DSN_WEB;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN_WEB;
    process.env.NEXT_RUNTIME = "nodejs";
    const { register } = await import("../../instrumentation");
    await register();
    expect(initServerSentry).not.toHaveBeenCalled();
  });

  it("does nothing on the edge runtime", async () => {
    process.env.SENTRY_DSN_WEB = "https://k@o1.ingest.sentry.io/1";
    process.env.NEXT_RUNTIME = "edge";
    const { register } = await import("../../instrumentation");
    await register();
    expect(initServerSentry).not.toHaveBeenCalled();
  });

  it("initialises on the node runtime when SENTRY_DSN_WEB is set", async () => {
    process.env.SENTRY_DSN_WEB = " https://k@o1.ingest.sentry.io/1 ";
    process.env.NEXT_RUNTIME = "nodejs";
    const { register } = await import("../../instrumentation");
    await register();
    expect(initServerSentry).toHaveBeenCalledWith("https://k@o1.ingest.sentry.io/1");
  });
});

describe("loader without a build-time DSN", () => {
  it("reportClientError and startSentryWhenIdle are inert", async () => {
    const { reportClientError, startSentryWhenIdle } = await import("./loader");
    expect(() => reportClientError(new Error("x"))).not.toThrow();
    expect(() => startSentryWhenIdle()).not.toThrow();
  });
});

describe("buildOptions", () => {
  it("is privacy-safe with 10% tracing", () => {
    const o = buildOptions("https://k@o1.ingest.sentry.io/1", { NODE_ENV: "production", SENTRY_RELEASE: "r1" });
    expect(o).toMatchObject({ sendDefaultPii: false, tracesSampleRate: 0.1, environment: "production", release: "r1" });
    expect(o.denyUrls.some((r) => r.test("https://checkout.razorpay.com/v1/checkout.js"))).toBe(true);
    expect(o.ignoreErrors.some((r) => r instanceof RegExp && r.test("NEXT_REDIRECT"))).toBe(true);
  });

  it("drops expected 4xx errors and scrubs the rest", () => {
    const o = buildOptions("x", {});
    for (const s of [401, 403, 404, 429]) {
      expect(o.beforeSend({ message: "m" }, { originalException: { status: s } })).toBeNull();
    }
    const out = o.beforeSend({ message: "oops a@b.co" }, { originalException: new Error("x") });
    expect(out).toEqual({ message: `oops ${REDACTED}` });
  });
});

describe("scrubEvent", () => {
  const dirty = () => ({
    message: "failed for jane@example.com",
    request: {
      url: "https://freshpetalsindia.com/checkout/success?order=ord_1&email=jane@example.com&token=SECRET123",
      query_string: "email=jane@example.com",
      cookies: { a: "b" },
      data: { password: "hunter2" },
      headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig", Cookie: "x=y", Accept: "text/html" },
    },
    user: { id: 9, email: "jane@example.com", ip_address: "1.2.3.4" },
    exception: { values: [{ value: "bad address for bob@example.org" }] },
    extra: { token: "t", fine: "ok" },
    transaction: "/track-order/results?email=a@b.co",
    breadcrumbs: [
      { category: "fetch", data: { url: "https://api.freshpetalsindia.com/orders/track?email=a@b.co", status_code: 404 } },
      { category: "navigation", data: { from: "/a?email=x@y.zz", to: "/b?token=1" } },
    ],
  });

  it("strips bodies, cookies, auth headers and query strings", () => {
    const e = scrubEvent(dirty());
    expect(e.request.data).toBeUndefined();
    expect(e.request.cookies).toBeUndefined();
    expect(e.request.headers.Authorization).toBe(REDACTED);
    expect(e.request.headers.Cookie).toBe(REDACTED);
    expect(e.request.headers.Accept).toBe("text/html");
    expect(e.request.url).toBe("https://freshpetalsindia.com/checkout/success");
    expect(e.request.query_string).toBe(REDACTED);
    expect(e.transaction).toBe("/track-order/results");
  });

  it("leaves no e-mail, token or password anywhere in the event", () => {
    const json = JSON.stringify(scrubEvent(dirty()));
    expect(json).not.toMatch(/jane@example|bob@example|a@b\.co|x@y\.zz|hunter2|SECRET123|eyJhbGci|1\.2\.3\.4/);
  });

  it("keeps only an opaque user id", () => {
    expect(scrubEvent(dirty()).user).toEqual({ id: "9" });
    expect(scrubEvent({ user: { email: "a@b.co" } }).user).toBeUndefined();
  });

  it("helpers", () => {
    expect(stripQuery("/p?x=1#h")).toBe("/p");
    expect(redactString("/a?code=123&b=2")).toBe(`/a?code=${REDACTED}&b=2`);
    expect(isExpectedClientError({ status: 404 })).toBe(true);
    expect(isExpectedClientError({ statusCode: 500 })).toBe(false);
    expect(isExpectedClientError(new Error("x"))).toBe(false);
  });
});

describe("scrubbing gaps (fix round)", () => {
  it("strips query strings from request.url and transactions (order search carries phones)", () => {
    const e = scrubEvent({
      request: { url: "https://admin.freshpetalsindia.com/orders?q=9876543210" },
      transaction: "/orders?q=9876543210",
    });
    expect(e.request.url).toBe("https://admin.freshpetalsindia.com/orders");
    expect(e.transaction).toBe("/orders");
  });

  it("scrubs span description and data (url.full, http.query, http.url, db.statement)", () => {
    const e = scrubEvent({
      spans: [
        {
          description: "GET https://api.resend.com/emails?to=a@b.co",
          data: {
            "url.full": "https://x.test/orders?q=9876543210",
            "http.query": "q=9876543210",
            "http.url": "https://x.test/a?email=a@b.co",
            "db.statement": "select 1 where phone = 9876543210",
            "http.status_code": 200,
          },
        },
      ],
    });
    const json = JSON.stringify(e);
    expect(json.includes("9876543210")).toBe(false);
    expect(json.includes("a@b.co")).toBe(false);
    expect(e.spans[0].data["http.status_code"]).toBe(200);
    expect(e.spans[0].description).toBe("GET https://api.resend.com/emails");
  });

  it("redacts Indian mobile numbers in every string field, in all common spellings", () => {
    const e = scrubEvent({
      message: "ring +91 98765 43210 or +91-9876543210 or 09876543210 or 9876543210",
      exception: { values: [{ value: "bad phone 9876543210" }] },
      breadcrumbs: [{ message: "sent to 8765432109", data: { note: "ring 7654321098" } }],
      extra: { note: "phone is 6543210987" },
    });
    expect(JSON.stringify(e)).not.toMatch(/987654|876543|765432|654321/);
    expect(redactString("order 1234567890123 total 99")).toBe("order 1234567890123 total 99");
  });

  it("truncates call arguments after 'invocation:' and caps exception values", () => {
    const e = scrubEvent({
      exception: {
        values: [
          { value: 'Invalid `prisma.order.create()` invocation:\n{ data: { name: "Jane Doe", address: "12 Rose Street" } }' },
          { value: "x".repeat(2000) },
        ],
      },
    });
    expect(e.exception.values[0].value).not.toMatch(/Jane|Rose/);
    expect(e.exception.values[0].value).toContain("invocation:");
    expect(e.exception.values[1].value.length).toBeLessThanOrEqual(503);
  });

  it("still redacts e-mail addresses", () => {
    expect(scrubEvent({ message: "fail jane@example.com" }).message).toBe(`fail ${REDACTED}`);
  });

  it("limits trace propagation to the targets passed in (never third parties by default)", () => {
    expect(buildOptions("x", {}).tracePropagationTargets).toEqual([]);
    expect(buildOptions("x", {}, ["http://127.0.0.1:3001"]).tracePropagationTargets).toEqual(["http://127.0.0.1:3001"]);
  });
});
