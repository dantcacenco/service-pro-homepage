import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: jobId } = await params;

    // Fetch service history for this job
    const { data: serviceHistory, error } = await supabase
      .from('job_service_history')
      .select(`
        id,
        submission_id,
        service_date,
        service_type,
        technician_id,
        work_description,
        additional_notes,
        materials_used,
        status,
        duration_minutes,
        photo_count,
        created_at,
        connecteam_employees!inner (
          id,
          first_name,
          last_name,
          role
        ),
        connecteam_form_submissions!inner (
          id,
          submission_id,
          submission_timestamp
        )
      `)
      .eq('job_id', jobId)
      .order('service_date', { ascending: false });

    if (error) {
      console.error('Error fetching service history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch service history' },
        { status: 500 }
      );
    }

    // Group by service event (by date and type)
    const eventGroups = new Map<string, any>();

    serviceHistory?.forEach((record) => {
      const eventKey = `${record.service_date}-${record.service_type}`;
      
      if (!eventGroups.has(eventKey)) {
        eventGroups.set(eventKey, {
          id: `event-${eventKey}`,
          service_date: record.service_date,
          service_type: record.service_type || 'service',
          status: record.status || 'done',
          proposal_number: null, // TODO: Link to proposal if needed
          submissions: []
        });
      }

      const event = eventGroups.get(eventKey);
      const employee = Array.isArray(record.connecteam_employees) 
        ? record.connecteam_employees[0] 
        : record.connecteam_employees;
      const submission = Array.isArray(record.connecteam_form_submissions)
        ? record.connecteam_form_submissions[0]
        : record.connecteam_form_submissions;

      event.submissions.push({
        id: record.id,
        submission_id: submission?.submission_id || record.submission_id,
        submission_timestamp: submission?.submission_timestamp || Date.now() / 1000,
        technician_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
        technician_role: employee?.role ? (Array.isArray(employee.role) ? employee.role[0] : employee.role) : null,
        duration_minutes: record.duration_minutes,
        photo_count: record.photo_count || 0,
        work_description: record.work_description,
        additional_notes: record.additional_notes,
        materials_used: record.materials_used
      });
    });

    // Convert map to array and sort submissions within each event
    const events = Array.from(eventGroups.values()).map(event => ({
      ...event,
      submissions: event.submissions.sort((a: any, b: any) => 
        a.submission_timestamp - b.submission_timestamp
      )
    }));

    return NextResponse.json({ events });

  } catch (error) {
    console.error('Error in service-history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
