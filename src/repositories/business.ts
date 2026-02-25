export interface Business {
  id: string;
  userId: string;
  name: string;
  industry?: string;
  description?: string;
  website?: string;
  createdAt: string;
}

const businesses: Business[] = [];

export const businessRepository = {
  findByUserId: (userId: string) =>
    businesses.find((b) => b.userId === userId) ?? null,

  findById: (id: string) =>
    businesses.find((b) => b.id === id) ?? null,

  create: (data: Omit<Business, 'id' | 'createdAt'>): Business => {
    const business: Business = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    businesses.push(business);
    return business;
  },

  update: (id: string, data: Partial<Business>): Business | null => {
    const idx = businesses.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    businesses[idx] = { ...businesses[idx], ...data };
    return businesses[idx];
  },
};