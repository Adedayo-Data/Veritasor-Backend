/**
 * Integration tests for attestations API.
 * Uses requireAuth; expects 401 when unauthenticated.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

const authHeader = { Authorization: "Bearer test-token" };

describe("Attestations API", () => {
  it("GET /api/attestations returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/attestations");
    expect(res.status).toBe(401);
    expect(
      res.body?.error === "Unauthorized" || res.body?.message,
    ).toBeTruthy();
  });

  it("GET /api/attestations list returns empty when no data", async () => {
    const res = await request(app).get("/api/attestations").set(authHeader);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.attestations)).toBe(true);
    expect(res.body.attestations.length).toBe(0);
    expect(res.body?.message).toBeTruthy();
  });

  it("GET /api/attestations list response has expected shape (with data case)", async () => {
    const res = await request(app).get("/api/attestations").set(authHeader);
    expect(res.status).toBe(200);
    expect("attestations" in res.body).toBe(true);
    expect(Array.isArray(res.body.attestations)).toBe(true);
    // When backend returns data, items can be validated here
  });

  it("GET /api/attestations/:id returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/attestations/abc-123");
    expect(res.status).toBe(401);
  });

  it("GET /api/attestations/:id returns attestation by id when authenticated", async () => {
    const res = await request(app)
      .get("/api/attestations/abc-123")
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body?.id).toBe("abc-123");
    expect(res.body?.message).toBeTruthy();
  });

  it("POST /api/attestations returns 401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/attestations")
      .set("Idempotency-Key", "test-key")
      .send({ business_id: "b1", period: "2024-01" });
    expect(res.status).toBe(401);
  });

  it("POST /api/attestations submit succeeds with auth and Idempotency-Key", async () => {
    const res = await request(app)
      .post("/api/attestations")
      .set(authHeader)
      .set("Idempotency-Key", "integration-test-submit-1")
      .send({ business_id: "b1", period: "2024-01" });
    expect(res.status).toBe(201);
    expect(res.body?.message).toBeTruthy();
    expect(res.body?.business_id).toBe("b1");
    expect(res.body?.period).toBe("2024-01");
  });

  it("POST /api/attestations duplicate request returns same response (idempotent)", async () => {
    const key = "integration-test-idempotent-" + Date.now();
    const first = await request(app)
      .post("/api/attestations")
      .set(authHeader)
      .set("Idempotency-Key", key)
      .send({ business_id: "b2", period: "2024-02" });
    expect(first.status).toBe(201);
    const second = await request(app)
      .post("/api/attestations")
      .set(authHeader)
      .set("Idempotency-Key", key)
      .send({ business_id: "b2", period: "2024-02" });
    expect(second.status).toBe(201);
    expect(second.body).toEqual(first.body);
  });

  it("DELETE /api/attestations/:id revoke returns 401 when unauthenticated", async () => {
    const res = await request(app).delete("/api/attestations/xyz-456");
    expect(res.status).toBe(401);
  });

  it("DELETE /api/attestations/:id revoke succeeds when authenticated", async () => {
    const res = await request(app)
      .delete("/api/attestations/xyz-456")
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body?.id).toBe("xyz-456");
    expect(res.body?.message).toBeTruthy();
  });
});

/**
 * Correlation ID tests for structured request logging.
 * Validates that correlation IDs are properly generated, propagated, and tracked.
 */
describe("Correlation ID - Structured Request Logging", () => {
  it("Request generates correlation ID when X-Request-ID header not provided", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    // Verify X-Request-ID header is present in response
    const correlationId = res.headers["x-request-id"];
    expect(correlationId).toBeTruthy();
    // Verify correlation ID is a valid UUID format
    expect(correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("Request reuses correlation ID from X-Request-ID header", async () => {
    const customCorrelationId = "test-correlation-id-12345";
    const res = await request(app)
      .get("/api/health")
      .set("X-Request-ID", customCorrelationId);
    expect(res.status).toBe(200);
    // Verify the same correlation ID is returned
    const returnedCorrelationId = res.headers["x-request-id"];
    expect(returnedCorrelationId).toBe(customCorrelationId);
  });

  it("Correlation ID is consistent across multiple requests with same header", async () => {
    const correlationId = "consistent-id-67890";
    // First request
    const res1 = await request(app)
      .get("/api/health")
      .set("X-Request-ID", correlationId);
    expect(res1.headers["x-request-id"]).toBe(correlationId);

    // Second request with same correlation ID
    const res2 = await request(app)
      .get("/api/attestations")
      .set(authHeader)
      .set("X-Request-ID", correlationId);
    expect(res2.headers["x-request-id"]).toBe(correlationId);
  });

  it("Different requests generate different correlation IDs", async () => {
    const res1 = await request(app).get("/api/health");
    const res2 = await request(app).get("/api/health");

    const correlationId1 = res1.headers["x-request-id"];
    const correlationId2 = res2.headers["x-request-id"];

    expect(correlationId1).toBeTruthy();
    expect(correlationId2).toBeTruthy();
    expect(correlationId1).not.toBe(correlationId2);
  });

  it("Correlation ID is present in authenticated requests", async () => {
    const res = await request(app).get("/api/attestations").set(authHeader);

    expect(res.status).toBe(200);
    const correlationId = res.headers["x-request-id"];
    expect(correlationId).toBeTruthy();
  });
});
