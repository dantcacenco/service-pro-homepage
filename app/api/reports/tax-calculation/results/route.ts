/**
 * Tax Calculation - Results Endpoint
 *
 * GET /api/reports/tax-calculation/results
 * Returns calculated tax results with optional filters
 *
 * Query Parameters:
 * - startDate: Filter by paid_date >= startDate (ISO date string)
 * - endDate: Filter by paid_date <= endDate (ISO date string)
 * - county: Filter by specific county (exact match)
 * - customerName: Filter by customer name (partial match)
 * - groupBy: 'county' (default) or 'invoice'
 *
 * Returns:
 * - For groupBy=county: Array of counties with aggregated tax data
 * - For groupBy=invoice: Array of individual invoices with tax data
 *
 * Authentication: Admin and Boss only
 *
 * Created: November 18, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[TAX RESULTS API] Received results request')

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[TAX RESULTS API] Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin or boss
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('[TAX RESULTS API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (profile.role !== 'admin' && profile.role !== 'boss') {
      console.warn('[TAX RESULTS API] Unauthorized access attempt by user:', user.id, 'role:', profile.role)
      return NextResponse.json(
        { error: 'Forbidden: Only admin and boss roles can view results' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const county = searchParams.get('county')
    const customerName = searchParams.get('customerName')
    const groupBy = searchParams.get('groupBy') || 'county'

    console.log('[TAX RESULTS API] Filters:', {
      startDate,
      endDate,
      county,
      customerName,
      groupBy
    })

    // Build base query for counted invoices
    let query = supabase
      .from('tax_calculation_results')
      .select('*')
      .eq('status', 'counted')

    // Apply filters
    if (startDate) {
      query = query.gte('paid_date', startDate)
    }
    if (endDate) {
      query = query.lte('paid_date', endDate)
    }
    if (county) {
      query = query.eq('geocoded_county', county)
    }
    if (customerName) {
      query = query.ilike('customer_name', `%${customerName}%`)
    }

    // Fetch results
    const { data: results, error: resultsError } = await query

    if (resultsError) {
      console.error('[TAX RESULTS API] Failed to fetch results:', resultsError)
      return NextResponse.json(
        { error: 'Failed to fetch tax results' },
        { status: 500 }
      )
    }

    console.log('[TAX RESULTS API] ✓ Fetched', results?.length || 0, 'results')

    // Group by county or return individual invoices
    if (groupBy === 'county') {
      // Aggregate by county
      const countyMap = new Map<string, {
        county: string
        invoiceCount: number
        totalSubtotal: number
        totalStateTax: number
        totalCountyTax: number
        totalTax: number
        avgCountyTaxRate: number
        invoices: any[]
      }>()

      for (const result of results || []) {
        const countyName = result.geocoded_county || 'Unknown'

        if (!countyMap.has(countyName)) {
          countyMap.set(countyName, {
            county: countyName,
            invoiceCount: 0,
            totalSubtotal: 0,
            totalStateTax: 0,
            totalCountyTax: 0,
            totalTax: 0,
            avgCountyTaxRate: 0,
            invoices: []
          })
        }

        const countyData = countyMap.get(countyName)!
        countyData.invoiceCount++
        countyData.totalSubtotal += parseFloat(result.subtotal || '0')
        countyData.totalStateTax += parseFloat(result.state_tax_amount || '0')
        countyData.totalCountyTax += parseFloat(result.county_tax_amount || '0')
        countyData.totalTax += parseFloat(result.total_tax || '0')
        countyData.avgCountyTaxRate = parseFloat(result.county_tax_rate || '0') // Will be averaged later
        countyData.invoices.push(result)
      }

      // Convert to array and calculate averages
      const counties = Array.from(countyMap.values()).map(county => ({
        ...county,
        avgCountyTaxRate: county.invoiceCount > 0
          ? county.invoices.reduce((sum, inv) => sum + parseFloat(inv.county_tax_rate || '0'), 0) / county.invoiceCount
          : 0
      }))

      // Sort by total tax (descending)
      counties.sort((a, b) => b.totalTax - a.totalTax)

      // Filter out counties with $0 total tax
      const filteredCounties = counties.filter(c => c.totalTax > 0)

      console.log('[TAX RESULTS API] ✓ Grouped into', filteredCounties.length, 'counties')

      return NextResponse.json({
        success: true,
        groupBy: 'county',
        counties: filteredCounties,
        totalCounties: filteredCounties.length,
        grandTotalSubtotal: filteredCounties.reduce((sum, c) => sum + c.totalSubtotal, 0),
        grandTotalStateTax: filteredCounties.reduce((sum, c) => sum + c.totalStateTax, 0),
        grandTotalCountyTax: filteredCounties.reduce((sum, c) => sum + c.totalCountyTax, 0),
        grandTotalTax: filteredCounties.reduce((sum, c) => sum + c.totalTax, 0)
      })

    } else {
      // Return individual invoices
      console.log('[TAX RESULTS API] ✓ Returning', results?.length || 0, 'invoices')

      return NextResponse.json({
        success: true,
        groupBy: 'invoice',
        invoices: results || [],
        totalInvoices: results?.length || 0,
        totalSubtotal: results?.reduce((sum, r) => sum + parseFloat(r.subtotal || '0'), 0) || 0,
        totalStateTax: results?.reduce((sum, r) => sum + parseFloat(r.state_tax_amount || '0'), 0) || 0,
        totalCountyTax: results?.reduce((sum, r) => sum + parseFloat(r.county_tax_amount || '0'), 0) || 0,
        totalTax: results?.reduce((sum, r) => sum + parseFloat(r.total_tax || '0'), 0) || 0
      })
    }

  } catch (error: any) {
    console.error('[TAX RESULTS API] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
