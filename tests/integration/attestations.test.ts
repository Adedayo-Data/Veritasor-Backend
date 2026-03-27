/**
 * Integration tests for attestations API.
 * Uses requireAuth; expects 401 when unauthenticated.
 *
 * Tests cover:
 * - Authentication requirements (401 on missing auth)
 * - CRUD operations (list, get, submit, revoke)
 * - Idempotency for duplicate submission prevention
 * - Security and validation edge cases
 */
import { test } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { app } from "../../src/app.js";

const authHeader = { Authorization: "Bearer test-token" };

test("GET /api/attestations returns 401 when unauthenticated", async () => {
  const res = await request(app).get("/api/attestations");
  assert.strictEqual(res.status, 401);
  assert.ok(res.body?.error === "Unauthorized" || res.body?.message);
});

test("GET /api/attestations list returns empty when no data", async () => {
  const res = await request(app).get("/api/attestations").set(authHeader);
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body?.attestations));
  assert.strictEqual(res.body.attestations.length, 0);
  assert.ok(res.body?.message);
});

test("GET /api/attestations list response has expected shape (with data case)", async () => {
  const res = await request(app).get("/api/attestations").set(authHeader);
  assert.strictEqual(res.status, 200);
  assert.ok("attestations" in res.body);
  assert.ok(Array.isArray(res.body.attestations));
  // When backend returns data, items can be validated here
});

test("GET /api/attestations/:id returns 401 when unauthenticated", async () => {
  const res = await request(app).get("/api/attestations/abc-123");
  assert.strictEqual(res.status, 401);
});

test("GET /api/attestations/:id returns attestation by id when authenticated", async () => {
  const res = await request(app)
    .get("/api/attestations/abc-123")
    .set(authHeader);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body?.id, "abc-123");
  assert.ok(res.body?.message);
});

test("POST /api/attestations returns 401 when unauthenticated", async () => {
  const res = await request(app)
    .post("/api/attestations")
    .set("Idempotency-Key", "test-key")
    .send({ business_id: "b1", period: "2024-01" });
  assert.strictEqual(res.status, 401);
});

test("POST /api/attestations submit succeeds with auth and Idempotency-Key", async () => {
  const res = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", "integration-test-submit-1")
    .send({ business_id: "b1", period: "2024-01" });
  assert.strictEqual(res.status, 201);
  assert.ok(res.body?.message);
  assert.strictEqual(res.body?.business_id, "b1");
  assert.strictEqual(res.body?.period, "2024-01");
});

test("POST /api/attestations duplicate request returns same response (idempotent)", async () => {
  const key = "integration-test-idempotent-" + Date.now();
  const first = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key)
    .send({ business_id: "b2", period: "2024-02" });
  assert.strictEqual(first.status, 201);
  const second = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key)
    .send({ business_id: "b2", period: "2024-02" });
  assert.strictEqual(second.status, 201);
  assert.deepStrictEqual(second.body, first.body);
});

test("DELETE /api/attestations/:id revoke returns 401 when unauthenticated", async () => {
  const res = await request(app).delete("/api/attestations/xyz-456");
  assert.strictEqual(res.status, 401);
});

test("DELETE /api/attestations/:id revoke succeeds when authenticated", async () => {
  const res = await request(app)
    .delete("/api/attestations/xyz-456")
    .set(authHeader);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body?.id, "xyz-456");
  assert.ok(res.body?.message);
});

// ===========================================
// Duplicate Submission Idempotency Tests
// ===========================================

/**
 * @title Duplicate Submission Tests
 * @description Tests for duplicate submission prevention using idempotency keys
 * @security Ensures that duplicate requests with same idempotency key return consistent responses
 */

test("POST /api/attestations duplicate submission returns same response (idempotent)", async () => {
  const key = "integration-test-idempotent-" + Date.now();
  const first = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key)
    .send({ business_id: "b2", period: "2024-02" });
  assert.strictEqual(first.status, 201);
  const second = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key)
    .send({ business_id: "b2", period: "2024-02" });
  assert.strictEqual(second.status, 201);
  assert.deepStrictEqual(second.body, first.body);
});

test("POST /api/attestations different idempotency keys create separate submissions", async () => {
  const key1 = "integration-test-key-1-" + Date.now();
  const key2 = "integration-test-key-2-" + Date.now();

  const first = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key1)
    .send({ business_id: "b3", period: "2024-03" });
  assert.strictEqual(first.status, 201);

  const second = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key2)
    .send({ business_id: "b3", period: "2024-03" });
  assert.strictEqual(second.status, 201);

  // Different keys should produce different IDs (not identical responses)
  assert.notStrictEqual(first.body.data?.id, second.body.data?.id);
});

test("POST /api/attestations without idempotency key returns 400", async () => {
  const res = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .send({ business_id: "b4", period: "2024-04" });
  assert.strictEqual(res.status, 400);
  assert.ok(
    res.body?.error?.toLowerCase().includes("idempotency") ||
      res.body?.message?.toLowerCase().includes("idempotency"),
  );
});

test("POST /api/attestations with empty idempotency key returns 400", async () => {
  const res = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", "")
    .send({ business_id: "b5", period: "2024-05" });
  assert.strictEqual(res.status, 400);
});

test("POST /api/attestations with whitespace-only idempotency key returns 400", async () => {
  const res = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", "   ")
    .send({ business_id: "b6", period: "2024-06" });
  assert.strictEqual(res.status, 400);
});

test("POST /api/attestations duplicate submission preserves txHash consistency", async () => {
  const key = "integration-test-txhash-" + Date.now();

  const first = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key)
    .send({ business_id: "b7", period: "2024-07", merkle_root: "abc123" });
  assert.strictEqual(first.status, 201);
  const firstTxHash = first.body.txHash;
  assert.ok(firstTxHash, "First request should have txHash");

  const second = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key)
    .send({ business_id: "b7", period: "2024-07", merkle_root: "abc123" });
  assert.strictEqual(second.status, 201);
  const secondTxHash = second.body.txHash;
  assert.ok(secondTxHash, "Second request should have txHash");

  // TxHash should be identical for duplicate requests
  assert.strictEqual(firstTxHash, secondTxHash);
});

test("POST /api/attestations idempotency key is case-sensitive", async () => {
  const keyLower = "integration-test-case-" + Date.now();
  const keyUpper = keyLower.toUpperCase();

  const first = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", keyLower)
    .send({ business_id: "b8", period: "2024-08" });
  assert.strictEqual(first.status, 201);

  const second = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", keyUpper)
    .send({ business_id: "b8", period: "2024-08" });
  assert.strictEqual(second.status, 201);

  // Different case should create different entries
  assert.notStrictEqual(first.body.data?.id, second.body.data?.id);
});

test("POST /api/attestations idempotency scoped to user - different users can use same key", async () => {
  // This test verifies that idempotency keys are user-scoped
  // Using same key with different auth should create separate entries
  const sharedKey = "integration-test-user-scope-" + Date.now();

  const first = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", sharedKey)
    .send({ business_id: "b9", period: "2024-09" });
  assert.strictEqual(first.status, 201);

  // Simulate different user with different token (if test infrastructure supports)
  const differentUserHeader = { Authorization: "Bearer different-user-token" };
  const second = await request(app)
    .post("/api/attestations")
    .set(differentUserHeader)
    .set("Idempotency-Key", sharedKey)
    .send({ business_id: "b10", period: "2024-10" });

  // Should succeed (different user = different scope)
  assert.strictEqual(second.status, 201);
});

test("POST /api/attestations idempotency works across rapid concurrent requests", async () => {
  const key = "integration-test-concurrent-" + Date.now();

  // Fire multiple concurrent requests with same key
  const promises = Array.from({ length: 5 }, () =>
    request(app)
      .post("/api/attestations")
      .set(authHeader)
      .set("Idempotency-Key", key)
      .send({ business_id: "b11", period: "2024-11" }),
  );

  const results = await Promise.all(promises);

  // All should succeed with same response (race condition handling)
  const statuses = results.map((r) => r.status);
  assert.ok(
    statuses.every((s) => s === 201),
    "All concurrent requests should return 201",
  );

  // All responses should be identical
  const firstBody = JSON.stringify(results[0].body);
  const allIdentical = results.every(
    (r) => JSON.stringify(r.body) === firstBody,
  );
  assert.ok(
    allIdentical,
    "All concurrent duplicate requests should return identical response",
  );
});

test("POST /api/attestations validation errors still work with idempotency key", async () => {
  const key = "integration-test-validation-" + Date.now();

  // First request with invalid data
  const first = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key)
    .send({ period: "" }); // Invalid: empty period

  // Should return 400 for validation error
  assert.strictEqual(first.status, 400);

  // Retry with same invalid data - should get same validation error
  const second = await request(app)
    .post("/api/attestations")
    .set(authHeader)
    .set("Idempotency-Key", key)
    .send({ period: "" });
  assert.strictEqual(second.status, 400);
  assert.deepStrictEqual(second.body, first.body);
});
