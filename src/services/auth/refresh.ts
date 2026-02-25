import { findUserById } from '../../repositories/userRepository.js'
import {
  generateToken,
  verifyRefreshToken,
} from '../../utils/jwt.js'

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  accessToken: string
}

export async function refresh(request: RefreshRequest): Promise<RefreshResponse> {
  const { refreshToken } = request

  if (!refreshToken) {
    throw new Error('Refresh token is required')
  }

  const payload = verifyRefreshToken(refreshToken)
  if (!payload) {
    throw new Error('Invalid or expired refresh token')
  }

  const user = await findUserById(payload.userId)
  if (!user) {
    throw new Error('User not found')
  }

  const accessToken = generateToken({
    userId: user.id,
    email: user.email,
  })

  return { accessToken }
}
