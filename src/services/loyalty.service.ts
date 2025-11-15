import { Client } from '../database/models/client.model'

export async function updateClientTier(clientId: string): Promise<void> {
    const client = await Client.findById(clientId)
    if (!client) return
    
    // Don't update Worker tier or manually set tiers
    if (client.loyaltyTier === 'Worker' || client.manualLoyaltyTier) return
    
    // Determine tier based on visit count
    if (client.visitsCount >= 50) {
        client.loyaltyTier = 'Gold'
    } else if (client.visitsCount >= 25) {
        client.loyaltyTier = 'Silver'
    } else if (client.visitsCount >= 10) {
        client.loyaltyTier = 'Bronze'
    } else {
        client.loyaltyTier = null
    }
    
    await client.save()
}
