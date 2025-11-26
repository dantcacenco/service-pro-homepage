import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBillcomClient } from '@/lib/billcom/client';
import archiver from 'archiver';
import type { Archiver } from 'archiver';
import { Readable } from 'stream';

/**
 * GET /api/jobs/[id]/export
 *
 * Exports complete job documentation as a structured ZIP file including:
 * - Job info (info.md)
 * - Proposal PDF
 * - Invoice PDFs (deposit, rough-in, final)
 * - ConnectTeam photos organized by submission date
 * - Job files
 * - Manifest.json with export metadata
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params;
    console.log('[EXPORT START] Job:', jobId);

    const supabase = createAdminClient();
    const billcomClient = getBillcomClient();

    // ==========================================
    // STEP 1: Fetch complete job data
    // ==========================================
    console.log('[EXPORT] Fetching job data...');

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers!customer_id (
          id,
          name,
          email,
          phone,
          address,
          billcom_customer_id
        )
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('[EXPORT] Job not found:', jobError);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    console.log('[EXPORT] Job data retrieved:', job.job_number);

    // Fetch proposal if exists
    let proposal = null;
    if (job.proposal_id) {
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', job.proposal_id)
        .single();

      proposal = proposalData;
      console.log('[EXPORT] Proposal found:', proposal?.proposal_number);
    }

    // Fetch ConnectTeam submissions
    console.log('[EXPORT] Fetching ConnectTeam submissions...');
    const { data: submissions } = await supabase
      .from('connecteam_form_submissions')
      .select(`
        *,
        connecteam_employees!employee_id (
          first_name,
          last_name
        )
      `)
      .eq('linked_job_id', jobId)
      .order('submission_timestamp', { ascending: true });

    // Fetch ConnectTeam photos for each submission
    const submissionsWithPhotos = await Promise.all(
      (submissions || []).map(async (submission) => {
        const { data: photos } = await supabase
          .from('connecteam_photos')
          .select('*')
          .eq('submission_id', submission.id)
          .order('created_at', { ascending: true });

        return {
          ...submission,
          photos: photos || []
        };
      })
    );

    console.log(`[EXPORT] Found ${submissionsWithPhotos.length} ConnectTeam submissions`);

    // Fetch job files
    console.log('[EXPORT] Fetching job files...');
    const { data: jobFiles } = await supabase
      .from('job_files')
      .select('*')
      .eq('job_id', jobId)
      .is('archived_at', null)
      .order('created_at', { ascending: true });

    console.log(`[EXPORT] Found ${jobFiles?.length || 0} job files`);

    // Ensure jobFiles is not null
    const safeJobFiles = jobFiles || [];

    // ==========================================
    // STEP 2: Create ZIP archive
    // ==========================================
    console.log('[EXPORT] Creating ZIP archive...');

    // Create folder name
    const folderName = `${job.job_number}_${job.customers?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Job'}`;

    // Create a new archiver instance
    const archive: Archiver = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Track files added for manifest
    const filesAdded: string[] = [];
    let totalPhotos = 0;

    // ==========================================
    // STEP 3: Generate and add info.md
    // ==========================================
    console.log('[EXPORT] Generating info.md...');
    const infoMd = generateInfoMd(job, proposal, submissions || []);
    archive.append(infoMd, { name: `${folderName}/info.md` });
    filesAdded.push('info.md');

    // ==========================================
    // STEP 4: Add proposal PDF (if exists)
    // ==========================================
    if (proposal && proposal.pdf_url) {
      try {
        console.log('[EXPORT] Fetching proposal PDF...');
        const pdfResponse = await fetch(proposal.pdf_url);
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          archive.append(Buffer.from(pdfBuffer), {
            name: `${folderName}/proposal.pdf`
          });
          filesAdded.push('proposal.pdf');
          console.log('[EXPORT] Proposal PDF added');
        }
      } catch (error) {
        console.error('[EXPORT] Failed to fetch proposal PDF:', error);
      }
    }

    // ==========================================
    // STEP 5: Fetch and add invoice PDFs from Bill.com
    // ==========================================
    if (proposal) {
      console.log('[EXPORT] Fetching invoices from Bill.com...');
      const invoiceTypes = [
        { id: proposal.billcom_deposit_invoice_id, name: 'deposit_invoice.pdf' },
        { id: proposal.billcom_roughin_invoice_id, name: 'roughin_invoice.pdf' },
        { id: proposal.billcom_final_invoice_id, name: 'final_invoice.pdf' }
      ];

      let invoiceCount = 0;
      for (const invoice of invoiceTypes) {
        if (invoice.id) {
          try {
            console.log(`[EXPORT] Fetching invoice ${invoiceCount + 1}/3...`);
            const pdfBuffer = await billcomClient.getInvoicePdf(invoice.id);
            if (pdfBuffer) {
              archive.append(pdfBuffer, {
                name: `${folderName}/invoices/${invoice.name}`
              });
              filesAdded.push(`invoices/${invoice.name}`);
              invoiceCount++;
              console.log(`[EXPORT] Invoice ${invoiceCount}/3 downloaded`);
            }
          } catch (error) {
            console.error(`[EXPORT] Failed to fetch ${invoice.name}:`, error);
          }
        }
      }
    }

    // ==========================================
    // STEP 6: Add ConnectTeam photos by submission date
    // ==========================================
    console.log('[EXPORT] Adding ConnectTeam photos...');

    for (const submission of submissionsWithPhotos) {
      if (submission.photos && submission.photos.length > 0) {
        const submissionDate = new Date(submission.submission_timestamp)
          .toISOString()
          .split('T')[0]; // YYYY-MM-DD format

        // Create submission details text file
        const submissionDetails = generateSubmissionDetails(submission);
        archive.append(submissionDetails, {
          name: `${folderName}/pictures/${submissionDate}/submission_details.txt`
        });

        // Add photos
        let photoIndex = 1;
        for (const photo of submission.photos) {
          try {
            console.log(`[EXPORT] Photo ${totalPhotos + 1} downloading...`);
            const photoResponse = await fetch(photo.connecteam_url);
            if (photoResponse.ok) {
              const photoBuffer = await photoResponse.arrayBuffer();
              const extension = photo.connecteam_url.split('.').pop()?.split('?')[0] || 'jpg';
              const photoName = `photo_${String(photoIndex).padStart(3, '0')}.${extension}`;

              archive.append(Buffer.from(photoBuffer), {
                name: `${folderName}/pictures/${submissionDate}/${photoName}`
              });

              photoIndex++;
              totalPhotos++;
              console.log(`[EXPORT] Photo ${totalPhotos} downloaded`);
            }
          } catch (error) {
            console.error(`[EXPORT] Failed to fetch photo:`, error);
          }
        }
      }
    }

    // ==========================================
    // STEP 7: Add job files
    // ==========================================
    console.log('[EXPORT] Adding job files...');

    if (safeJobFiles && safeJobFiles.length > 0) {
      for (const file of safeJobFiles) {
        try {
          const fileResponse = await fetch(file.file_url);
          if (fileResponse.ok) {
            const fileBuffer = await fileResponse.arrayBuffer();
            archive.append(Buffer.from(fileBuffer), {
              name: `${folderName}/files/${file.file_name}`
            });
            filesAdded.push(`files/${file.file_name}`);
          }
        } catch (error) {
          console.error(`[EXPORT] Failed to fetch job file ${file.file_name}:`, error);
        }
      }
    }

    // ==========================================
    // STEP 8: Generate and add manifest.json
    // ==========================================
    console.log('[EXPORT] Generating manifest.json...');
    const manifest = generateManifest(job, proposal, filesAdded, totalPhotos, submissionsWithPhotos.length);
    archive.append(JSON.stringify(manifest, null, 2), {
      name: `${folderName}/manifest.json`
    });

    // ==========================================
    // STEP 9: Finalize and stream ZIP
    // ==========================================
    console.log('[EXPORT] Finalizing ZIP...');

    // Finalize the archive
    archive.finalize();

    // Convert archive stream to Node.js Readable stream
    const archiveStream = Readable.from(archive as any);

    console.log(`[EXPORT COMPLETE] Total files: ${filesAdded.length}, Photos: ${totalPhotos}`);

    // Return as streaming response
    return new Response(archiveStream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${folderName}.zip"`,
      },
    });

  } catch (error) {
    console.error('[EXPORT ERROR]', error);
    return NextResponse.json(
      {
        error: 'Failed to export job',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Generate info.md content
 */
function generateInfoMd(job: any, proposal: any, submissions: any[]): string {
  const customer = job.customers;

  let content = `# Job Information

**Job Number:** ${job.job_number}
**Customer:** ${customer?.name || 'N/A'}
**Address:** ${job.service_address || customer?.address || 'N/A'}
**Phone:** ${customer?.phone || 'N/A'}
**Email:** ${customer?.email || 'N/A'}

`;

  // Proposal section
  if (proposal) {
    content += `## Proposal
- Proposal Number: ${proposal.proposal_number}
- Status: ${proposal.status}
- Total Value: $${proposal.total?.toFixed(2) || '0.00'}
${proposal.approved_at ? `- Approved on: ${new Date(proposal.approved_at).toLocaleDateString()}` : ''}
${proposal.pdf_url ? `- [View Proposal](${proposal.pdf_url})` : ''}

`;
  }

  // Invoice section
  if (proposal) {
    content += `## Invoices
`;

    if (proposal.billcom_deposit_invoice_id) {
      content += `- Deposit Invoice - ${proposal.billcom_deposit_status || 'PENDING'}\n`;
    }
    if (proposal.billcom_roughin_invoice_id) {
      content += `- Rough-in Invoice - ${proposal.billcom_roughin_status || 'PENDING'}\n`;
    }
    if (proposal.billcom_final_invoice_id) {
      content += `- Final Invoice - ${proposal.billcom_final_status || 'PENDING'}\n`;
    }

    content += '\n';
  }

  // Job details
  content += `## Job Details
- Status: ${job.status}
- Stage: ${job.stage || 'Not specified'}
- Created: ${new Date(job.created_at).toLocaleDateString()}
${job.notes ? `\n### Notes\n${job.notes}\n` : ''}

`;

  // Service history summary
  if (submissions && submissions.length > 0) {
    content += `## Service History
Total Submissions: ${submissions.length}

`;

    submissions.forEach((sub, index) => {
      const techName = sub.connecteam_employees
        ? `${sub.connecteam_employees.first_name} ${sub.connecteam_employees.last_name}`
        : 'Unknown';

      content += `### ${index + 1}. ${new Date(sub.submission_timestamp).toLocaleDateString()} - ${techName}
`;

      if (sub.work_description) {
        content += `**Work Done:** ${sub.work_description}\n`;
      }

      if (sub.additional_notes) {
        content += `**Notes:** ${sub.additional_notes}\n`;
      }

      if (sub.parts_materials_needed) {
        content += `**Materials:** ${sub.parts_materials_needed}\n`;
      }

      content += '\n';
    });
  }

  return content;
}

/**
 * Generate submission_details.txt for each ConnectTeam submission
 */
function generateSubmissionDetails(submission: any): string {
  const techName = submission.connecteam_employees
    ? `${submission.connecteam_employees.first_name} ${submission.connecteam_employees.last_name}`
    : 'Unknown';

  let content = `ConnectTeam Form Submission
Date: ${new Date(submission.submission_timestamp).toLocaleString()}
Technician: ${techName}

`;

  if (submission.start_time || submission.end_time) {
    content += `Time on Site:
`;
    if (submission.start_time) {
      content += `- Start: ${new Date(submission.start_time).toLocaleTimeString()}\n`;
    }
    if (submission.end_time) {
      content += `- End: ${new Date(submission.end_time).toLocaleTimeString()}\n`;
    }
    content += '\n';
  }

  if (submission.job_type && submission.job_type.length > 0) {
    content += `Job Type: ${Array.isArray(submission.job_type) ? submission.job_type.join(', ') : submission.job_type}

`;
  }

  if (submission.work_description) {
    content += `Work Description:
${submission.work_description}

`;
  }

  if (submission.additional_notes) {
    content += `Additional Notes:
${submission.additional_notes}

`;
  }

  if (submission.parts_materials_needed) {
    content += `Parts/Materials Needed:
${submission.parts_materials_needed}

`;
  }

  if (submission.manager_note) {
    content += `Manager Note:
${submission.manager_note}

`;
  }

  content += `Photos Included: ${submission.photos?.length || 0}
`;

  return content;
}

/**
 * Generate manifest.json metadata
 */
function generateManifest(
  job: any,
  proposal: any,
  filesAdded: string[],
  totalPhotos: number,
  totalSubmissions: number
): any {
  return {
    export_version: '1.0',
    export_date: new Date().toISOString(),
    job: {
      job_number: job.job_number,
      job_id: job.id,
      customer_name: job.customers?.name,
      service_address: job.service_address,
      status: job.status,
      stage: job.stage,
      created_at: job.created_at
    },
    proposal: proposal ? {
      proposal_number: proposal.proposal_number,
      total: proposal.total,
      status: proposal.status,
      approved_at: proposal.approved_at
    } : null,
    contents: {
      total_files: filesAdded.length,
      total_photos: totalPhotos,
      total_submissions: totalSubmissions,
      files_included: filesAdded
    },
    generated_by: 'Job Export System v1.0'
  };
}
