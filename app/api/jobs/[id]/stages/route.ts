/**
 * Job Stages API
 * Handles stage transitions, step completion, and stage queries
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  moveToStage,
  completeStep,
  uncompleteStep,
  getStageProgress,
  advanceStageIfReady,
} from '@/lib/stages/transitions'
import { type JobStage } from '@/lib/stages/definitions'

// ============================================================================
// GET - Get stage details for a job
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    // Get stage progress information
    const progress = await getStageProgress(jobId)

    if (!progress) {
      return NextResponse.json(
        { error: 'Job not found or stage data unavailable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      progress,
    })
  } catch (error: any) {
    console.error('Stage GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update stage or complete/uncomplete steps
// ============================================================================

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const body = await request.json()

    // Handle step completion/uncompletion
    if (body.action === 'complete_step') {
      if (!body.step_id) {
        return NextResponse.json(
          { error: 'step_id is required for complete_step action' },
          { status: 400 }
        )
      }

      const result = await completeStep(
        jobId,
        body.step_id,
        body.user_id,
        body.notes
      )

      return NextResponse.json({
        success: result.success,
        message: result.message,
        step_status: result.step_status,
        should_advance: result.should_advance,
      })
    }

    if (body.action === 'uncomplete_step') {
      if (!body.step_id) {
        return NextResponse.json(
          { error: 'step_id is required for uncomplete_step action' },
          { status: 400 }
        )
      }

      const result = await uncompleteStep(jobId, body.step_id)

      return NextResponse.json({
        success: result.success,
        message: result.message,
      })
    }

    // Handle stage update
    if (body.action === 'update_stage') {
      if (!body.new_stage) {
        return NextResponse.json(
          { error: 'new_stage is required for update_stage action' },
          { status: 400 }
        )
      }

      const result = await moveToStage(
        jobId,
        body.new_stage as JobStage,
        body.user_id,
        body.notes
      )

      return NextResponse.json({
        success: result.success,
        message: result.message,
        job: result.job,
        errors: result.errors,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be: complete_step, uncomplete_step, or update_stage' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Stage PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Move to next stage automatically
// ============================================================================

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const body = await request.json()

    if (body.action === 'advance_stage') {
      const result = await advanceStageIfReady(jobId, body.user_id)

      return NextResponse.json({
        success: result.success,
        message: result.message,
        job: result.job,
        errors: result.errors,
      })
    }

    if (body.action === 'manual_override') {
      if (!body.target_stage) {
        return NextResponse.json(
          { error: 'target_stage is required for manual_override action' },
          { status: 400 }
        )
      }

      const result = await moveToStage(
        jobId,
        body.target_stage as JobStage,
        body.user_id,
        body.notes || 'Manual stage override'
      )

      return NextResponse.json({
        success: result.success,
        message: result.message,
        job: result.job,
        errors: result.errors,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be: advance_stage or manual_override' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Stage POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
