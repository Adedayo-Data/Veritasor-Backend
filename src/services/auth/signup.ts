import { createUser, findUserByEmail } from '../../repositories/userRepository.js'
import { hashPassword } from '../../utils/password.js'
import {
  generateToken,
  generateRefreshToken,
} from '../../utils/jwt.js'

export interface SignupRequest {
  email: string
  password: string
}

export interface SignupResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
  }
}

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  const { email, password } = request

  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  const passwordHash = await hashPassword(password)
  const user = await createUser(email, passwordHash)

  const accessToken = generateToken({
    userId: user.id,
    email: user.email,
  })

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
    },
  }
}
