import { attestationRepository } from '../../repositories/attestation.js'

export type RevenueReport = {
  period: string
  total: number
  net: number
  currency: string
  breakdown: { attestationId: string; attestedAt: string }[]
}

export const getRevenueReport = (
  businessId: string,
  period?: string,
  from?: string,
  to?: string,
): RevenueReport | null => {
  let attestations = attestationRepository.listByBusiness(businessId)

  if (period) {
    attestations = attestations.filter((a) => a.period === period)
  } else if (from && to) {
    attestations = attestations.filter((a) => a.period >= from && a.period <= to)
  }

  if (attestations.length === 0) return null

  const resolvedPeriod = period ?? `${from} to ${to}` ?? 'all'
  const total = attestations.length * 100 // placeholder until real revenue data lands
  const net = total * 0.95 // placeholder 5% fee deduction

  return {
    period: resolvedPeriod,
    total,
    net,
    currency: 'USD',
    breakdown: attestations.map((a) => ({
      attestationId: a.id,
      attestedAt: a.attestedAt,
    })),
  }
}