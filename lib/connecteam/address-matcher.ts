/**
 * ConnectTeam Address Matcher
 * 
 * Matches ConnectTeam job addresses to Service Pro jobs
 * Uses fuzzy string matching with configurable thresholds
 */

export interface AddressMatch {
  jobId: string;
  jobAddress: string;
  matchScore: number; // 0.0 to 1.0
  matchMethod: 'exact' | 'fuzzy' | 'manual';
  confidence: 'high' | 'medium' | 'low';
}

export interface MatchOptions {
  minScore?: number; // Minimum score to consider a match (default: 0.8)
  exactMatchOnly?: boolean; // Only return exact matches
  includeArchived?: boolean; // Include archived jobs
}

/**
 * Normalize address for comparison
 * - Lowercase
 * - Remove punctuation
 * - Standardize abbreviations
 * - Remove extra whitespace
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  
  let normalized = address.toLowerCase();
  
  // Remove common prefixes/suffixes
  normalized = normalized.replace(/^(the|a|an)\s+/gi, '');
  normalized = normalized.replace(/,\s*(usa|united states|us)$/gi, '');
  
  // Standardize state abbreviations (for NC specifically)
  normalized = normalized.replace(/,?\s*north carolina\s*/gi, ', nc ');
  normalized = normalized.replace(/,?\s*\bnc\b\s*/gi, ', nc ');
  
  // Standardize common street abbreviations
  const abbrevs: Record<string, string> = {
    'street': 'st',
    'avenue': 'ave',
    'boulevard': 'blvd',
    'road': 'rd',
    'drive': 'dr',
    'lane': 'ln',
    'court': 'ct',
    'circle': 'cir',
    'place': 'pl',
    'parkway': 'pkwy',
    'terrace': 'ter',
    'highway': 'hwy',
  };
  
  Object.entries(abbrevs).forEach(([full, abbrev]) => {
    // Match whole word boundaries
    const regex = new RegExp(`\\b${full}\\b`, 'gi');
    normalized = normalized.replace(regex, abbrev);
  });
  
  // Remove punctuation except hyphens in numbers (e.g., "123-A")
  normalized = normalized.replace(/[.,#]/g, ' ');
  
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of edits needed to transform one string into another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create distance matrix
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));
  
  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0.0 to 1.0)
 * Uses normalized Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  return 1 - (distance / maxLength);
}

/**
 * Extract street number from address
 * Useful for partial matching
 */
function extractStreetNumber(address: string): string | null {
  const match = address.match(/^\d+/);
  return match ? match[0] : null;
}

/**
 * Check if addresses have same street number
 * Quick pre-filter before fuzzy matching
 */
function haveSameStreetNumber(addr1: string, addr2: string): boolean {
  const num1 = extractStreetNumber(addr1);
  const num2 = extractStreetNumber(addr2);
  
  if (!num1 || !num2) return false;
  return num1 === num2;
}

/**
 * Match a ConnectTeam address to Service Pro jobs
 * Returns best match if score exceeds threshold
 */
export async function matchAddressToJob(
  connecteamAddress: string,
  jobs: Array<{ id: string; address: string }>,
  options: MatchOptions = {}
): Promise<AddressMatch | null> {
  const {
    minScore = 0.8,
    exactMatchOnly = false,
  } = options;
  
  if (!connecteamAddress || !jobs || jobs.length === 0) {
    return null;
  }
  
  const normalizedConnecteam = normalizeAddress(connecteamAddress);
  
  // Try exact match first
  for (const job of jobs) {
    const normalizedJob = normalizeAddress(job.address);
    
    if (normalizedConnecteam === normalizedJob) {
      return {
        jobId: job.id,
        jobAddress: job.address,
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
  const matches: AddressMatch[] = [];
  
  for (const job of jobs) {
    const normalizedJob = normalizeAddress(job.address);
    
    // Pre-filter: must have same street number if both exist
    const ctStreetNum = extractStreetNumber(normalizedConnecteam);
    const jobStreetNum = extractStreetNumber(normalizedJob);
    
    if (ctStreetNum && jobStreetNum && ctStreetNum !== jobStreetNum) {
      continue; // Different street numbers, skip
    }
    
    // Calculate similarity
    const score = calculateSimilarity(normalizedConnecteam, normalizedJob);
    
    if (score >= minScore) {
      matches.push({
        jobId: job.id,
        jobAddress: job.address,
        matchScore: score,
        matchMethod: 'fuzzy',
        confidence: score >= 0.95 ? 'high' : score >= 0.85 ? 'medium' : 'low',
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
 * Find all potential matches above threshold
 * Useful for manual review/selection
 */
export async function findAllMatches(
  connecteamAddress: string,
  jobs: Array<{ id: string; address: string }>,
  options: MatchOptions = {}
): Promise<AddressMatch[]> {
  const {
    minScore = 0.7, // Lower threshold for showing all possibilities
  } = options;
  
  if (!connecteamAddress || !jobs || jobs.length === 0) {
    return [];
  }
  
  const normalizedConnecteam = normalizeAddress(connecteamAddress);
  const matches: AddressMatch[] = [];
  
  for (const job of jobs) {
    const normalizedJob = normalizeAddress(job.address);
    
    // Calculate similarity
    const score = calculateSimilarity(normalizedConnecteam, normalizedJob);
    
    if (score >= minScore) {
      const isExact = normalizedConnecteam === normalizedJob;
      
      matches.push({
        jobId: job.id,
        jobAddress: job.address,
        matchScore: score,
        matchMethod: isExact ? 'exact' : 'fuzzy',
        confidence: score >= 0.95 ? 'high' : score >= 0.85 ? 'medium' : 'low',
      });
    }
  }
  
  // Sort by score (highest first)
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  return matches;
}

/**
 * Batch match multiple ConnectTeam addresses
 * Returns map of address -> match
 */
export async function batchMatchAddresses(
  addresses: string[],
  jobs: Array<{ id: string; address: string }>,
  options: MatchOptions = {}
): Promise<Map<string, AddressMatch | null>> {
  const results = new Map<string, AddressMatch | null>();
  
  for (const address of addresses) {
    const match = await matchAddressToJob(address, jobs, options);
    results.set(address, match);
  }
  
  return results;
}
