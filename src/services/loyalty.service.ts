import { Client } from '../database/models/client.model'

const LOYALTY_TIERS = [
    { minVisits: 15, tier: 'Gold' },
    { minVisits: 8, tier: 'Silver' },
    { minVisits: 3, tier: 'Bronze' }
] as const

export async function applyLoyaltyAfterFulfilled(clientId: string) {
    const client = await Client.findById(clientId)
    if (!client) return
    
    client.visitsCount = (client.visitsCount ?? 0) + 1
    client.loyaltyTier = determineLoyaltyTier(client.visitsCount)
    await client.save()
}

function determineLoyaltyTier(visitsCount: number): string | undefined {
    for (const { minVisits, tier } of LOYALTY_TIERS) {
        if (visitsCount >= minVisits) return tier
    }
    return undefined
}
