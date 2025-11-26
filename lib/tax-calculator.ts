// Tax Calculator with County Lookup via Census Geocoding API
// NC State Tax: 4.75%
// County taxes vary - this uses Census API to determine county
// County tax rates stored in database (nc_county_tax_rates table)

import { createAdminClient } from './supabase/admin';

export interface TaxCalculation {
  stateTax: number;
  countyTax: number;
  totalTax: number;
  stateTaxAmount: number;
  countyTaxAmount: number;
  totalTaxAmount: number;
  county?: string;
  error?: string;
}

const NC_STATE_TAX = 0.0475; // 4.75%
const DEFAULT_COUNTY_TAX = 0.02; // 2% default if county not found

// Database lookup for county tax rates
async function getCountyTaxRate(countyName: string): Promise<{ stateTaxRate: number; countyTaxRate: number; totalTaxRate: number } | null> {
  try {
    const supabase = createAdminClient();

    // Census API returns county names without "County" suffix (e.g., "Wake" not "Wake County")
    // So we query the database using the county name directly
    const { data, error } = await supabase
      .from('nc_county_tax_rates')
      .select('state_tax_rate, county_tax_rate, total_tax_rate')
      .eq('county_name', countyName)
      .single();

    if (error) {
      console.error('[TAX CALCULATOR] Database query error:', error);
      return null;
    }

    if (!data) {
      console.warn(`[TAX CALCULATOR] County not found in database: ${countyName}`);
      return null;
    }

    console.log(`[TAX CALCULATOR] Found tax rates for ${countyName}:`, {
      state: `${(data.state_tax_rate * 100).toFixed(2)}%`,
      county: `${(data.county_tax_rate * 100).toFixed(2)}%`,
      total: `${(data.total_tax_rate * 100).toFixed(2)}%`
    });

    return {
      stateTaxRate: Number(data.state_tax_rate),
      countyTaxRate: Number(data.county_tax_rate),
      totalTaxRate: Number(data.total_tax_rate)
    };
  } catch (error) {
    console.error('[TAX CALCULATOR] Error fetching county tax rate:', error);
    return null;
  }
}

// Step 1: Get coordinates from address
async function getCoordinates(address: {
  street: string;
  city: string;
  state: string;
  zip?: string;
}): Promise<{ x: number; y: number } | null> {
  try {
    const params = new URLSearchParams({
      street: address.street,
      city: address.city,
      state: address.state,
      benchmark: 'Public_AR_Current',
      format: 'json'
    });

    if (address.zip) {
      params.append('zip', address.zip);
    }

    const response = await fetch(
      `https://geocoding.geo.census.gov/geocoder/locations/address?${params}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch coordinates');
    }

    const data = await response.json();
    
    if (data.result?.addressMatches?.length > 0) {
      const match = data.result.addressMatches[0];
      return {
        x: match.coordinates.x,
        y: match.coordinates.y
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
}

// Step 2: Get county from coordinates
async function getCountyFromCoordinates(coords: { x: number; y: number }): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      x: coords.x.toString(),
      y: coords.y.toString(),
      benchmark: '2020',
      vintage: '2020',
      layers: 'Counties',
      format: 'json'
    });

    const response = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${params}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch county');
    }

    const data = await response.json();
    
    if (data.result?.geographies?.Counties?.length > 0) {
      return data.result.geographies.Counties[0].NAME;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting county:', error);
    return null;
  }
}

// Main function to calculate tax
export async function calculateTax(
  subtotal: number,
  address: {
    street: string;
    city: string;
    state: string;
    zip?: string;
  },
  manualCountyOverride?: string
): Promise<TaxCalculation> {
  console.log('[TAX CALCULATOR] Starting tax calculation for:', { subtotal, address, manualCountyOverride });

  let county = manualCountyOverride;
  let stateTaxRate = NC_STATE_TAX;
  let countyTaxRate = DEFAULT_COUNTY_TAX;

  // Handle out-of-state addresses
  if (!county && address.state !== 'NC') {
    console.log(`[TAX CALCULATOR] Out-of-state address detected (${address.state}), using 'Out of State' tax rate`);
    county = 'Out of State';
  }
  // If no manual override and NC address, look up county from address
  else if (!county && address.state === 'NC') {
    console.log('[TAX CALCULATOR] Looking up county from address via Census API...');
    const coords = await getCoordinates(address);
    if (coords) {
      console.log('[TAX CALCULATOR] Coordinates found:', coords);
      county = await getCountyFromCoordinates(coords) || undefined;
      console.log('[TAX CALCULATOR] County determined:', county);
    } else {
      console.warn('[TAX CALCULATOR] Could not get coordinates from address');
    }
  }

  // Get the tax rate for the county from database
  if (county) {
    console.log(`[TAX CALCULATOR] Fetching tax rates from database for: ${county}`);
    const taxRateData = await getCountyTaxRate(county);

    if (taxRateData) {
      stateTaxRate = taxRateData.stateTaxRate;
      countyTaxRate = taxRateData.countyTaxRate;
      console.log(`[TAX CALCULATOR] Using database rates - State: ${(stateTaxRate * 100).toFixed(2)}%, County: ${(countyTaxRate * 100).toFixed(2)}%`);
    } else {
      console.warn(`[TAX CALCULATOR] County "${county}" not found in database, using defaults`);
      countyTaxRate = DEFAULT_COUNTY_TAX;
    }
  } else {
    console.warn('[TAX CALCULATOR] No county determined, using default county tax rate');
  }

  // Calculate tax amounts
  const stateTaxAmount = subtotal * stateTaxRate;
  const countyTaxAmount = subtotal * countyTaxRate;
  const totalTaxAmount = stateTaxAmount + countyTaxAmount;

  const result = {
    stateTax: stateTaxRate,
    countyTax: countyTaxRate,
    totalTax: stateTaxRate + countyTaxRate,
    stateTaxAmount: Math.round(stateTaxAmount * 100) / 100,
    countyTaxAmount: Math.round(countyTaxAmount * 100) / 100,
    totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
    county: county || 'Unknown County'
  };

  console.log('[TAX CALCULATOR] Final calculation:', result);
  return result;
}

// Helper function to format tax for display
export function formatTaxDisplay(tax: TaxCalculation): string {
  const statePercent = (tax.stateTax * 100).toFixed(2);
  const countyPercent = (tax.countyTax * 100).toFixed(2);
  const totalPercent = (tax.totalTax * 100).toFixed(2);
  
  return `NC State Tax (${statePercent}%): $${tax.stateTaxAmount.toFixed(2)}
${tax.county} Tax (${countyPercent}%): $${tax.countyTaxAmount.toFixed(2)}
Total Tax (${totalPercent}%): $${tax.totalTaxAmount.toFixed(2)}`;
}

// Function to send tax line items to Bill.com
export function prepareTaxItemsForBillcom(tax: TaxCalculation) {
  return [
    {
      description: `NC State Sales Tax (${(tax.stateTax * 100).toFixed(2)}%)`,
      amount: tax.stateTaxAmount,
      quantity: 1,
      price: tax.stateTaxAmount,
      type: 'TAX' // This tells Bill.com it's a tax item
    },
    {
      description: `${tax.county} Tax (${(tax.countyTax * 100).toFixed(2)}%)`,
      amount: tax.countyTaxAmount,
      quantity: 1,
      price: tax.countyTaxAmount,
      type: 'TAX' // This tells Bill.com it's a tax item
    }
  ];
}