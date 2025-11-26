/**
 * US Census Geocoding API Integration
 *
 * Free geocoding service to convert addresses to county names
 * No API key required - public service
 *
 * API Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
 *
 * Created: November 18, 2025
 */

export interface GeocodingResult {
  success: boolean
  county: string | null
  state: string | null
  confidence: 'Match' | 'No_Match' | 'Tie' | 'Error'
  rawResponse: any
  errorMessage?: string
}

/**
 * Parse address string into components for geocoding
 * Example input: "123 Main St, Asheville, NC 28801"
 */
function parseAddress(fullAddress: string): {
  street: string
  city: string
  state: string
  zip: string
} {
  // Clean the address
  const cleaned = fullAddress.trim()

  // Split by commas
  const parts = cleaned.split(',').map(p => p.trim())

  if (parts.length < 2) {
    // Try to extract zip code with regex
    const zipMatch = cleaned.match(/\b\d{5}(-\d{4})?\b/)
    const zip = zipMatch ? zipMatch[0] : ''

    // Try to extract state (2-letter code)
    const stateMatch = cleaned.match(/\b([A-Z]{2})\b/)
    const state = stateMatch ? stateMatch[1] : 'NC'

    return {
      street: parts[0] || '',
      city: '',
      state: state,
      zip: zip
    }
  }

  // Standard format: "Street, City, State Zip"
  const street = parts[0] || ''
  const city = parts[1] || ''

  // Last part might be "NC 28801" or "NC" or "28801"
  const lastPart = parts[parts.length - 1] || ''
  const stateZipMatch = lastPart.match(/([A-Z]{2})?\s*(\d{5}(-\d{4})?)?/)

  const state = stateZipMatch?.[1] || 'NC'
  const zip = stateZipMatch?.[2] || ''

  return { street, city, state, zip }
}

/**
 * Geocode address using US Census Geocoding API
 *
 * @param address Full address string (e.g., "123 Main St, Asheville, NC 28801")
 * @returns GeocodingResult with county name and confidence
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!address || address.trim() === '') {
    return {
      success: false,
      county: null,
      state: null,
      confidence: 'Error',
      rawResponse: null,
      errorMessage: 'Address is empty'
    }
  }

  try {
    console.log('[GEOCODING] Input address:', address)

    // Parse address into components
    const { street, city, state, zip } = parseAddress(address)
    console.log('[GEOCODING] Parsed components:', { street, city, state, zip })

    // Build US Census API URL
    // Using "onelineaddress" format for simplicity
    const encodedAddress = encodeURIComponent(`${street}, ${city}, ${state} ${zip}`)
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodedAddress}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`

    console.log('[GEOCODING] API URL:', url)

    // Call US Census API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('[GEOCODING] API error:', response.status, response.statusText)
      return {
        success: false,
        county: null,
        state: null,
        confidence: 'Error',
        rawResponse: null,
        errorMessage: `API returned ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    console.log('[GEOCODING] API response:', JSON.stringify(data, null, 2))

    // Check if we got matches
    if (!data.result || !data.result.addressMatches || data.result.addressMatches.length === 0) {
      console.warn('[GEOCODING] No matches found for address:', address)
      return {
        success: false,
        county: null,
        state: null,
        confidence: 'No_Match',
        rawResponse: data,
        errorMessage: 'No address matches found'
      }
    }

    // Get first match
    const match = data.result.addressMatches[0]
    const geographies = match.geographies

    // Extract county from geographies
    // Counties are in the "Counties" array
    if (!geographies || !geographies.Counties || geographies.Counties.length === 0) {
      console.warn('[GEOCODING] No county data in response for:', address)
      return {
        success: false,
        county: null,
        state: null,
        confidence: 'No_Match',
        rawResponse: data,
        errorMessage: 'No county data in geocoding response'
      }
    }

    const countyData = geographies.Counties[0]
    const countyName = countyData.NAME // e.g., "Buncombe"
    const stateName = countyData.STATE // e.g., "NC" or "37" (FIPS code)

    // Check if it's a Tie (multiple matches)
    const confidence = data.result.addressMatches.length > 1 ? 'Tie' : 'Match'

    console.log('[GEOCODING] ✓ Success:', { county: countyName, state: stateName, confidence })

    return {
      success: true,
      county: countyName, // "Buncombe", "Henderson", etc.
      state: stateName,
      confidence: confidence,
      rawResponse: data
    }

  } catch (error: any) {
    console.error('[GEOCODING] Exception:', error)
    return {
      success: false,
      county: null,
      state: null,
      confidence: 'Error',
      rawResponse: null,
      errorMessage: error.message || 'Unknown error during geocoding'
    }
  }
}

/**
 * Batch geocode multiple addresses (rate-limited to avoid overwhelming API)
 *
 * @param addresses Array of addresses to geocode
 * @param delayMs Delay between requests in milliseconds (default 200ms = 5 req/sec)
 * @returns Array of GeocodingResults
 */
export async function batchGeocodeAddresses(
  addresses: string[],
  delayMs: number = 200
): Promise<GeocodingResult[]> {
  const results: GeocodingResult[] = []

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    console.log(`[GEOCODING BATCH] Processing ${i + 1} of ${addresses.length}: ${address}`)

    const result = await geocodeAddress(address)
    results.push(result)

    // Rate limit: wait before next request (except on last item)
    if (i < addresses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Test geocoding with a known address
 * Run with: node -e "require('./lib/tax-reports/geocoding.ts').testGeocoding()"
 */
export async function testGeocoding() {
  const testAddresses = [
    '214 Alta Vista Dr, Candler, NC 28715', // Buncombe County
    '100 N Main St, Hendersonville, NC 28792', // Henderson County
    '123 Main St, Asheville, NC 28801', // Buncombe County
    'Invalid Address XYZ', // Should fail
  ]

  console.log('=== Testing US Census Geocoding ===\n')

  for (const address of testAddresses) {
    console.log(`Testing: ${address}`)
    const result = await geocodeAddress(address)
    console.log(`Result: ${result.success ? '✓' : '✗'} County: ${result.county}, Confidence: ${result.confidence}`)
    if (result.errorMessage) {
      console.log(`Error: ${result.errorMessage}`)
    }
    console.log('---')
  }
}
