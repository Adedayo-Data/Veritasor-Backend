import { randomBytes } from 'crypto'

export interface User {
  id: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
  resetToken?: string
  resetTokenExpiry?: Date
}

// In-memory user storage
const users: Map<string, User> = new Map()
const emailIndex: Map<string, string> = new Map() // email -> userId

/**
 * Generate a simple ID
 */
function generateId(): string {
  return randomBytes(16).toString('hex')
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  passwordHash: string
): Promise<User> {
  const user: User = {
    id: generateId(),
    email,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  users.set(user.id, user)
  emailIndex.set(email, user.id)

  return user
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const userId = emailIndex.get(email)
  if (!userId) return null

  return users.get(userId) ?? null
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  return users.get(id) ?? null
}

/**
 * Update user's password
 */
export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<User | null> {
  const user = users.get(userId)
  if (!user) return null

  user.passwordHash = passwordHash
  user.updatedAt = new Date()
  user.resetToken = undefined
  user.resetTokenExpiry = undefined

  return user
}

/**
 * Set password reset token
 */
export async function setResetToken(
  userId: string,
  token: string,
  expiryMinutes: number = 30
): Promise<User | null> {
  const user = users.get(userId)
  if (!user) return null

  user.resetToken = token
  user.resetTokenExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000)

  return user
}

/**
 * Find user by reset token
 */
export async function findUserByResetToken(
  token: string
): Promise<User | null> {
  for (const user of users.values()) {
    if (
      user.resetToken === token &&
      user.resetTokenExpiry &&
      user.resetTokenExpiry > new Date()
    ) {
      return user
    }
  }
  return null
}

/**
 * Delete user (for testing/cleanup)
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const user = users.get(userId)
  if (!user) return false

  emailIndex.delete(user.email)
  users.delete(userId)

  return true
}
