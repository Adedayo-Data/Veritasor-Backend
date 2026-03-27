import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { businessRepository } from '../../src/repositories/business.js'

const { submitAttestationMock } = vi.hoisted(() => ({
  submitAttestationMock: vi.fn(),
}))

vi.mock('../../src/services/soroban/submitAttestation.js', () => ({
  submitAttestation: submitAttestationMock,
}))

import { app } from '../../src/app.js'

const authHeader = { 'x-user-id': 'user_1' }
const business = {
  id: 'biz_1',
  userId: 'user_1',
  name: 'Acme Inc',
  industry: null,
  description: null,
  website: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('Attestations API integration', () => {
  beforeEach(() => {
    submitAttestationMock.mockReset()
    vi.spyOn(businessRepository, 'getByUserId').mockResolvedValue(business)
    vi.spyOn(businessRepository, 'findByUserId').mockResolvedValue(business)
  })

  it('returns 401 when listing attestations without authentication', async () => {
    const res = await request(app).get('/api/attestations')

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
  })

  it('lists attestations for the authenticated business with pagination metadata', async () => {
    const res = await request(app).get('/api/attestations').set(authHeader)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data[0].businessId).toBe('biz_1')
    expect(res.body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      totalPages: 1,
    })
  })

  it('returns an attestation by id for the authenticated business', async () => {
    const res = await request(app).get('/api/attestations/att_1').set(authHeader)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.data).toMatchObject({
      id: 'att_1',
      businessId: 'biz_1',
    })
  })

  it('submits an attestation and persists the Soroban transaction hash', async () => {
    submitAttestationMock.mockResolvedValue({
      txHash: 'tx_success_123',
    })

    const res = await request(app)
      .post('/api/attestations')
      .set(authHeader)
      .set('Idempotency-Key', 'integration-submit-success')
      .send({
        period: '2026-02',
        merkleRoot: 'abc123',
        timestamp: 1700000000,
        version: '1.2.0',
      })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe('success')
    expect(res.body.txHash).toBe('tx_success_123')
    expect(res.body.data).toMatchObject({
      businessId: 'biz_1',
      period: '2026-02',
      merkleRoot: 'abc123',
      timestamp: 1700000000,
      version: '1.2.0',
      txHash: 'tx_success_123',
      status: 'submitted',
    })
    expect(submitAttestationMock).toHaveBeenCalledTimes(1)
    expect(submitAttestationMock).toHaveBeenCalledWith({
      business: 'biz_1',
      period: '2026-02',
      merkleRoot: 'abc123',
      timestamp: 1700000000,
      version: '1.2.0',
    })
  })

  it('returns the cached response for duplicate idempotent submissions', async () => {
    submitAttestationMock.mockResolvedValue({
      txHash: 'tx_cached_123',
    })

    const key = `integration-idempotent-${Date.now()}`
    const payload = {
      period: '2026-03',
      merkleRoot: 'root-123',
      timestamp: 1700000100,
      version: '1.0.0',
    }

    const first = await request(app)
      .post('/api/attestations')
      .set(authHeader)
      .set('Idempotency-Key', key)
      .send(payload)

    const second = await request(app)
      .post('/api/attestations')
      .set(authHeader)
      .set('Idempotency-Key', key)
      .send(payload)

    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(second.body).toEqual(first.body)
    expect(submitAttestationMock).toHaveBeenCalledTimes(1)
  })

  it('returns 400 when the idempotency key is missing', async () => {
    const res = await request(app)
      .post('/api/attestations')
      .set(authHeader)
      .send({
        period: '2026-04',
        merkleRoot: 'root-456',
      })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing Idempotency-Key header' })
  })

  it('maps Soroban RPC failures to a 502 response', async () => {
    submitAttestationMock.mockRejectedValue(
      Object.assign(new Error('retry budget exhausted'), {
        code: 'SUBMIT_FAILED',
      }),
    )

    const res = await request(app)
      .post('/api/attestations')
      .set(authHeader)
      .set('Idempotency-Key', `integration-submit-failure-${Date.now()}`)
      .send({
        period: '2026-05',
        merkleRoot: 'root-789',
      })

    expect(res.status).toBe(502)
    expect(res.body).toMatchObject({
      status: 'error',
      code: 'SUBMIT_FAILED',
      message: 'Soroban RPC request failed after applying the retry policy.',
    })
  })

  it('maps signer configuration failures to a 503 response without leaking secrets', async () => {
    submitAttestationMock.mockRejectedValue(
      Object.assign(new Error('signerSecret does not match sourcePublicKey.'), {
        code: 'SIGNER_MISMATCH',
      }),
    )

    const res = await request(app)
      .post('/api/attestations')
      .set(authHeader)
      .set('Idempotency-Key', `integration-signer-failure-${Date.now()}`)
      .send({
        period: '2026-06',
        merkleRoot: 'root-999',
      })

    expect(res.status).toBe(503)
    expect(res.body).toMatchObject({
      status: 'error',
      code: 'SIGNER_MISMATCH',
      message: 'Soroban submission is not available right now.',
    })
    expect(res.body.message).not.toContain('signerSecret')
  })
})
