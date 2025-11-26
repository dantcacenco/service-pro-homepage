/**
 * Customer Matcher
 *
 * Matches jobs to customers based on address similarity
 * Uses the same fuzzy matching logic as ConnectTeam address matcher
 */

import { normalizeAddress, calculateSimilarity } from './connecteam/address-matcher';
import { createClient } from '@/lib/supabase/server';

export interface CustomerMatch {
  customerId: string;
  customerName: string;
  customerAddress: string;
  matchScore: number; // 0.0 to 1.0
  matchMethod: 'exact' | 'fuzzy';
  confidence: 'high' | 'medium' | 'low';
}

export interface MatchOptions {
  minScore?: number; // Minimum score to consider a match (default: 0.85)
  exactMatchOnly?: boolean; // Only return exact matches
}

/**
 * Match a job address to a customer
 * Returns best match if score exceeds threshold
 */
export async function matchJobToCustomer(
  jobAddress: string,
  options: MatchOptions = {}
): Promise<CustomerMatch | null> {
  const {
    minScore = 0.85, // Higher threshold for customer matching
    exactMatchOnly = false,
  } = options;

  if (!jobAddress) {
    return null;
  }

  // Get all customers from database
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, address')
    .not('address', 'is', null);

  if (error || !customers || customers.length === 0) {
    console.error('Error fetching customers for matching:', error);
    return null;
  }

  const normalizedJobAddress = normalizeAddress(jobAddress);

  // Try exact match first
  for (const customer of customers) {
    const normalizedCustomerAddress = normalizeAddress(customer.address);

    if (normalizedJobAddress === normalizedCustomerAddress) {
      return {
        customerId: customer.id,
        customerName: customer.name,
        customerAddress: customer.address,
        matchScore: 1.0,
        matchMethod: 'exact',
        confidence: 'high',
      };
    }
  }

  // If exact match only, stop here
  if (exactMatchOnly) {
    return null;
  }

  // Try fuzzy matching
  const matches: CustomerMatch[] = [];

  for (const customer of customers) {
    const normalizedCustomerAddress = normalizeAddress(customer.address);

    // Calculate similarity
    const score = calculateSimilarity(normalizedJobAddress, normalizedCustomerAddress);

    if (score >= minScore) {
      matches.push({
        customerId: customer.id,
        customerName: customer.name,
        customerAddress: customer.address,
        matchScore: score,
        matchMethod: 'fuzzy',
        confidence: score >= 0.95 ? 'high' : score >= 0.90 ? 'medium' : 'low',
      });
    }
  }

  // Return best match if any found
  if (matches.length === 0) {
    return null;
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches[0];
}

/**
 * Find all potential customer matches for a job
 * Useful for manual review/selection
 */
export async function findAllCustomerMatches(
  jobAddress: string,
  options: MatchOptions = {}
): Promise<CustomerMatch[]> {
  const {
    minScore = 0.75, // Lower threshold for showing all possibilities
  } = options;

  if (!jobAddress) {
    return [];
  }

  // Get all customers from database
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, address')
    .not('address', 'is', null);

  if (error || !customers || customers.length === 0) {
    console.error('Error fetching customers for matching:', error);
    return [];
  }

  const normalizedJobAddress = normalizeAddress(jobAddress);
  const matches: CustomerMatch[] = [];

  for (const customer of customers) {
    const normalizedCustomerAddress = normalizeAddress(customer.address);

    // Calculate similarity
    const score = calculateSimilarity(normalizedJobAddress, normalizedCustomerAddress);

    if (score >= minScore) {
      const isExact = normalizedJobAddress === normalizedCustomerAddress;

      matches.push({
        customerId: customer.id,
        customerName: customer.name,
        customerAddress: customer.address,
        matchScore: score,
        matchMethod: isExact ? 'exact' : 'fuzzy',
        confidence: score >= 0.95 ? 'high' : score >= 0.90 ? 'medium' : 'low',
      });
    }
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
}

/**
 * Batch match multiple jobs to customers
 * Returns map of jobId -> customer match
 */
export async function batchMatchJobsToCustomers(
  jobs: Array<{ id: string; address: string }>,
  options: MatchOptions = {}
): Promise<Map<string, CustomerMatch | null>> {
  const results = new Map<string, CustomerMatch | null>();

  // Get all customers once (more efficient than per-job queries)
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, address')
    .not('address', 'is', null);

  if (error || !customers || customers.length === 0) {
    console.error('Error fetching customers for batch matching:', error);
    // Return empty matches for all jobs
    for (const job of jobs) {
      results.set(job.id, null);
    }
    return results;
  }

  // Match each job
  for (const job of jobs) {
    if (!job.address) {
      results.set(job.id, null);
      continue;
    }

    const normalizedJobAddress = normalizeAddress(job.address);
    let bestMatch: CustomerMatch | null = null;
    let bestScore = 0;

    for (const customer of customers) {
      const normalizedCustomerAddress = normalizeAddress(customer.address);
      const score = calculateSimilarity(normalizedJobAddress, normalizedCustomerAddress);

      if (score > bestScore && score >= (options.minScore || 0.85)) {
        bestScore = score;
        const isExact = normalizedJobAddress === normalizedCustomerAddress;

        bestMatch = {
          customerId: customer.id,
          customerName: customer.name,
          customerAddress: customer.address,
          matchScore: score,
          matchMethod: isExact ? 'exact' : 'fuzzy',
          confidence: score >= 0.95 ? 'high' : score >= 0.90 ? 'medium' : 'low',
        };
      }
    }

    results.set(job.id, bestMatch);
  }

  return results;
}
