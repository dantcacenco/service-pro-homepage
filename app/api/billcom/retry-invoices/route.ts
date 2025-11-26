import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This endpoint checks for approved proposals without invoices and creates them
// Can be called manually or via cron job for reliability

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Find approved proposals without Bill.com invoices
    const { data: proposalsNeedingInvoices, error: queryError } = await supabase
      .from('proposals')
      .select('id, proposal_number, status')
      .eq('status', 'approved')
      .is('billcom_invoice_id', null)
      .limit(10) // Process up to 10 at a time
    
    if (queryError) {
      console.error('Error querying proposals:', queryError)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }
    
    if (!proposalsNeedingInvoices || proposalsNeedingInvoices.length === 0) {
      return NextResponse.json({ 
        message: 'No proposals need invoice creation',
        checked: new Date().toISOString()
      })
    }
    
    console.log(`Found ${proposalsNeedingInvoices.length} proposals needing invoices`)
    
    const results = []
    
    for (const proposal of proposalsNeedingInvoices) {
      try {
        console.log(`Processing proposal ${proposal.proposal_number}...`)
        
        // Call the approve-automation endpoint to create invoice
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fairairhc.service-pro.app'
        const response = await fetch(`${baseUrl}/api/proposals/approve-automation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposalId: proposal.id })
        })
        
        const result = await response.json()
        
        if (response.ok && result.invoiceId) {
          console.log(`✅ Invoice created for proposal ${proposal.proposal_number}: ${result.invoiceId}`)
          results.push({
            proposalId: proposal.id,
            proposalNumber: proposal.proposal_number,
            status: 'success',
            invoiceId: result.invoiceId,
            invoiceLink: result.invoiceLink
          })
        } else {
          console.error(`❌ Failed to create invoice for proposal ${proposal.proposal_number}:`, result.error)
          results.push({
            proposalId: proposal.id,
            proposalNumber: proposal.proposal_number,
            status: 'failed',
            error: result.error || 'Unknown error'
          })
        }
        
        // Add a small delay between requests to avoid overwhelming Bill.com
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error: any) {
        console.error(`Error processing proposal ${proposal.proposal_number}:`, error)
        results.push({
          proposalId: proposal.id,
          proposalNumber: proposal.proposal_number,
          status: 'error',
          error: error.message
        })
      }
    }
    
    return NextResponse.json({
      message: `Processed ${results.length} proposals`,
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Error in invoice retry job:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to run invoice retry job' 
    }, { status: 500 })
  }
}