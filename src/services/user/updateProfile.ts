export type User = {
  id: string
  email: string
  name?: string
  profile?: Record<string, any>
}

/**
 * Update a user's profile. This is a stubbed service that would
 * normally persist changes to a database. It validates allowed fields
 * and returns the updated user object.
 */
export async function updateProfile(userId: string, updates: Partial<User>): Promise<User> {
  if (!userId) throw new Error('userId required')

  const allowed: (keyof User)[] = ['name', 'profile']
  const payload: Partial<User> = {}
  for (const k of allowed) {
    if (k in updates) {
      // simple runtime validation
      if (k === 'name' && updates.name !== undefined && typeof updates.name !== 'string') {
        throw new Error('name must be a string')
      }
      if (k === 'profile' && updates.profile !== undefined && typeof updates.profile !== 'object') {
        throw new Error('profile must be an object')
      }
      // @ts-ignore
      payload[k] = updates[k]
    }
  }

  // Stub: return merged object. In real app, fetch existing user from DB
  const existing: User = {
    id: userId,
    email: 'user@example.com',
    name: 'Existing User',
    profile: {},
  }

  const updated: User = {
    ...existing,
    ...payload,
  }

  return updated
}

export default updateProfile
