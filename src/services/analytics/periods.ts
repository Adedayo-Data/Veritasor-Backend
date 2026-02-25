import { attestationRepository } from '../../repositories/attestation.js'

export const listAttestedPeriodsForBusiness = (businessId: string): string[] => {
  const attestations = attestationRepository.listByBusiness(businessId)
  return Array.from(new Set(attestations.map((attestation) => attestation.period))).sort((a, b) =>
    b.localeCompare(a),
  )
}
