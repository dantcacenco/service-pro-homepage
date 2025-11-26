/**
 * Address Customer Matcher
 *
 * Matches ConnectTeam submission addresses to existing customers
 * Uses fuzzy matching with 90% accuracy threshold
 */

import { createAdminClient } from '@/lib/supabase/admin'
import * as fuzz from 'fuzzball'

/**
 * Normalize address for comparison
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove extra spaces
 * - Remove punctuation variations
 * - Standardize common abbreviations
 * - Remove unit numbers
 */
function normalizeAddress(address: string): string {
  return address
    .trim()
    .toLowerCase()
    // Standardize common abbreviations
    .replace(/\bstreet\b/g, 'st')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bcircle\b/g, 'cir')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\bnorth carolina\b/g, 'nc')
    .replace(/\bapartment\b/g, 'apt')
    .replace(/\bsuite\b/g, 'ste')
    // Remove unit numbers (#, Apt, Suite, etc)
    .replace(/,?\s*(apt|apartment|suite|ste|unit|#)\s*[\w\d-]+/gi, '')
    // Remove punctuation
    .replace(/[,\.]/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim()
}

interface MatchResult {
  customer_id: string
  customer_name: string
  customer_address: string
  confidence: number
}

/**
 * Match submission address to existing customer using fuzzy matching
 * @param address - Address from ConnectTeam submission
 * @returns customer_id or null if no match found (below 90% threshold)
 */
export async function matchAddressToCustomer(address: string): Promise<string | null> {
  if (!address || address.trim() === '') {
    console.log('[Address Matcher] Empty address provided')
    return null
  }

  const normalizedSearchAddress = normalizeAddress(address)
  console.log('[Address Matcher] 🔍 Searching for:', address)
  console.log('[Address Matcher] 📝 Normalized:', normalizedSearchAddress)

  const supabase = createAdminClient()

  // Fetch all customers with addresses
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, address')
    .not('address', 'is', null)

  if (error) {
    console.error('[Address Matcher] ❌ Error fetching customers:', error)
    return null
  }

  if (!customers || customers.length === 0) {
    console.log('[Address Matcher] ⚠️  No customers with addresses found')
    return null
  }

  console.log(`[Address Matcher] 📊 Comparing against ${customers.length} customers`)

  // Find best match using fuzzy matching
  let bestMatch: MatchResult | null = null
  let bestScore = 0

  for (const customer of customers) {
    const normalizedCustomerAddress = normalizeAddress(customer.address)

    // Use fuzzball's ratio for Levenshtein distance-based similarity (0-100)
    const score = fuzz.ratio(normalizedSearchAddress, normalizedCustomerAddress)

    if (score > bestScore) {
      bestScore = score
      bestMatch = {
        customer_id: customer.id,
        customer_name: customer.name,
        customer_address: customer.address,
        confidence: score
      }
    }
  }

  // Log best match regardless of threshold
  if (bestMatch) {
    console.log('[Address Matcher] 🎯 Best match found:')
    console.log(`[Address Matcher]    Customer: ${bestMatch.customer_name}`)
    console.log(`[Address Matcher]    Address: ${bestMatch.customer_address}`)
    console.log(`[Address Matcher]    Confidence: ${bestMatch.confidence.toFixed(1)}%`)
  }

  // Only return match if confidence >= 90%
  const CONFIDENCE_THRESHOLD = 90
  if (bestMatch && bestMatch.confidence >= CONFIDENCE_THRESHOLD) {
    console.log(`[Address Matcher] ✅ Match accepted (${bestMatch.confidence.toFixed(1)}% >= ${CONFIDENCE_THRESHOLD}%)`)
    console.log(`[Address Matcher]    Customer ID: ${bestMatch.customer_id}`)
    return bestMatch.customer_id
  }

  if (bestMatch) {
    console.log(`[Address Matcher] ❌ Match rejected (${bestMatch.confidence.toFixed(1)}% < ${CONFIDENCE_THRESHOLD}%)`)
  }
  console.log('[Address Matcher] 🔴 No match found above threshold for:', address)
  return null
}

/**
 * Get customer name by ID for logging
 */
export async function getCustomerName(customerId: string): Promise<string | null> {
  const supabase = createAdminClient()
  
  const { data } = await supabase
    .from('customers')
    .select('name')
    .eq('id', customerId)
    .single()
  
  return data?.name || null
}
