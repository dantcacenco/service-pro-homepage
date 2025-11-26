// Bill.com Tax Management - Simplified Approach
// Updates ONE tax item per invoice based on customer county

export const NC_STATE_TAX_RATE = 0.0475; // 4.75%

interface UpdateTaxItemParams {
  sessionId: string;
  taxItemId: string;
  county: string;
  rate: number;
  devKey: string;
  apiUrl: string;
}

// Combined tax rates per county (state + county)
const COUNTY_TAX_RATES: Record<string, number> = {
  'wake': 0.0725,        // 4.75% + 2.50%
  'mecklenburg': 0.0725, // 4.75% + 2.50%
  'durham': 0.07,        // 4.75% + 2.25%
  'buncombe': 0.07,      // 4.75% + 2.25%
  'guilford': 0.07,      // 4.75% + 2.25%
  'forsyth': 0.0675,     // 4.75% + 2.00%
  'cumberland': 0.0675,  // 4.75% + 2.00%
  'new hanover': 0.0675  // 4.75% + 2.00%
};

export async function updateTaxItem(params: UpdateTaxItemParams): Promise<void> {
  try {
    const percentage = params.rate * 100; // Convert 0.07 to 7
    
    const response = await fetch(
      `${params.apiUrl}/v2/Crud/Update/Item.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          devKey: params.devKey,
          sessionId: params.sessionId,
          data: JSON.stringify({
            obj: {
              entity: 'Item',
              id: params.taxItemId,
              type: '6',  // Tax type (NOT itemType!)
              name: `NC Sales Tax - ${params.county} County`,
              description: `North Carolina Sales Tax (${percentage.toFixed(2)}%)`,
              percentage: percentage
            }
          })
        }).toString()
      }
    );

    const data = await response.json();
    
    if (data.response_status !== 0) {
      throw new Error(
        `Failed to update tax item: ${data.response_data?.error_message || 'Unknown error'}`
      );
    }
    
    console.log(`✅ Tax item updated: ${params.county} County at ${percentage.toFixed(2)}%`);
  } catch (error) {
    console.error('Error updating tax item:', error);
    throw error;
  }
}

export function getCombinedTaxRate(county: string): number {
  const countyLower = county.toLowerCase();
  return COUNTY_TAX_RATES[countyLower] || 0.07; // Default 7%
}

export function extractCountyFromAddress(address: string): string | null {
  const addressLower = address.toLowerCase();
  
  // Major NC cities to county mapping
  const cityToCounty: Record<string, string> = {
    'raleigh': 'Wake',
    'cary': 'Wake',
    'charlotte': 'Mecklenburg',
    'durham': 'Durham',
    'greensboro': 'Guilford',
    'winston-salem': 'Forsyth',
    'asheville': 'Buncombe',
    'candler': 'Buncombe',
    'fayetteville': 'Cumberland',
    'wilmington': 'New Hanover'
  };
  
  // Check for city match
  for (const [city, county] of Object.entries(cityToCounty)) {
    if (addressLower.includes(city)) {
      return county;
    }
  }
  
  // Check for direct county mention
  for (const county of Object.keys(COUNTY_TAX_RATES)) {
    if (addressLower.includes(county)) {
      // Capitalize first letter
      return county.charAt(0).toUpperCase() + county.slice(1);
    }
  }
  
  return null;
}
