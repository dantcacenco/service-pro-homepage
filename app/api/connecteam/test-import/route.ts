/**
 * Test Import Endpoint - Debug 11/18 submissions
 *
 * Tests importing the two 11/18 submissions with detailed logging
 * GET /api/connecteam/test-import
 */

import { NextResponse } from 'next/server'
import { processConnectTeamSubmissions, ConnectTeamSubmission } from '@/lib/connecteam/process-submissions'

export async function GET() {
  const logs: string[] = []

  function log(message: string) {
    console.log(message)
    logs.push(message)
  }

  try {
    log('[TEST IMPORT] Creating test submissions for 11/18...')

    // Excel date conversion for 11/18/2025 5:46 PM
    const excelDate1 = 45979.74040509259
    const epoch = new Date(1899, 11, 30)
    const days1 = Math.floor(excelDate1)
    const date1 = new Date(epoch.getTime() + days1 * 24 * 60 * 60 * 1000)
    date1.setHours(17, 46, 0, 0) // 5:46 PM
    const timestamp1 = date1.toISOString()

    // Excel date conversion for 11/18/2025 2:43 PM
    const excelDate2 = 45979.61340277778
    const days2 = Math.floor(excelDate2)
    const date2 = new Date(epoch.getTime() + days2 * 24 * 60 * 60 * 1000)
    date2.setHours(14, 43, 0, 0) // 2:43 PM
    const timestamp2 = date2.toISOString()

    log(`[TEST IMPORT] Timestamp 1: ${timestamp1}`)
    log(`[TEST IMPORT] Timestamp 2: ${timestamp2}`)

    const submissions: ConnectTeamSubmission[] = [
      {
        submission_id: `excel-324-${excelDate1}`,
        job_location: '171 Houston Cir, Asheville, NC 28801, USA',
        job_type: 'Service Call',
        additional_notes: 'Test note from 11/18 submission #324',
        parts_materials_needed: undefined,
        what_was_done: 'HVAC service work',
        submission_timestamp: timestamp1,
        updated_at: timestamp1,
        technician_name: 'Ruslan Halamaha',
        linked_job_id: undefined
      },
      {
        submission_id: `excel-323-${excelDate2}`,
        job_location: '89 Wellington St, Asheville, NC 28806, USA',
        job_type: 'Service Call',
        additional_notes: 'Test note from 11/18 submission #323',
        parts_materials_needed: undefined,
        what_was_done: 'HVAC service work',
        submission_timestamp: timestamp2,
        updated_at: timestamp2,
        technician_name: 'Ruslan Halamaha',
        linked_job_id: undefined
      }
    ]

    log(`[TEST IMPORT] Created ${submissions.length} test submissions`)
    log('[TEST IMPORT] Calling processConnectTeamSubmissions...')

    const result = await processConnectTeamSubmissions(submissions)

    log('[TEST IMPORT] Processing complete!')
    log(`[TEST IMPORT] Result: ${JSON.stringify(result, null, 2)}`)

    return NextResponse.json({
      success: true,
      logs,
      result,
      submissions: submissions.map(s => ({
        id: s.submission_id,
        location: s.job_location,
        timestamp: s.submission_timestamp
      }))
    })

  } catch (error: any) {
    log(`[TEST IMPORT] ERROR: ${error.message}`)
    log(`[TEST IMPORT] Stack: ${error.stack}`)

    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      logs
    }, { status: 500 })
  }
}
