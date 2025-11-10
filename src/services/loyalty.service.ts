import { Client } from '../database/models/client.model'

export async function applyLoyaltyAfterFulfilled(clientId: string) {
    const c = await Client.findById(clientId); if (!c) return
    c.visitsCount = (c.visitsCount ?? 0) + 1
    if (c.visitsCount >= 15) c.loyaltyTier = 'Gold'
    else if (c.visitsCount >= 8) c.loyaltyTier = 'Silver'
    else if (c.visitsCount >= 3) c.loyaltyTier = 'Bronze'
    await c.save()
}
