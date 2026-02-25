import {
  findUserByResetToken,
  updateUserPassword,
} from '../../repositories/userRepository.js'
import { hashPassword } from '../../utils/password.js'

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ResetPasswordResponse {
  message: string
}

export async function resetPassword(
  request: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const { token, newPassword } = request

  if (!token || !newPassword) {
    throw new Error('Token and new password are required')
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  const user = await findUserByResetToken(token)
  if (!user) {
    throw new Error('Invalid or expired reset token')
  }

  const passwordHash = await hashPassword(newPassword)
  await updateUserPassword(user.id, passwordHash)

  return {
    message: 'Password has been reset successfully',
  }
}
