/**
 * ConnectTeam Status Mapper
 * 
 * Maps between ConnectTeam manager statuses and Service Pro job statuses.
 * Used for import and bi-directional sync.
 */

/**
 * Maps ConnectTeam manager status to Service Pro job status
 * 
 * @param connecteamStatus - The status from ConnectTeam manager field
 * @returns Service Pro job status string
 */
export function mapConnecteamToJobStatus(connecteamStatus: string): string {
  const statusMap: Record<string, string> = {
    'Working on it': 'working_on_it',
    'Done': 'done',
    'SENT INVOICE': 'sent_invoice',
    'Warranty': 'warranty',
    'Start Up': 'start_up',
    'Parts Needed': 'parts_needed',
    'Estimate': 'estimate',
    'Ask Vadim': 'ask_vadim',
    'Warranty/No Charge': 'warranty_no_charge'
  }
  
  return statusMap[connecteamStatus] || 'scheduled'
}

/**
 * Maps Service Pro job status to ConnectTeam manager status
 * 
 * @param jobStatus - The status from Service Pro job
 * @returns ConnectTeam manager status string
 */
export function mapJobToConnecteamStatus(jobStatus: string): string {
  const statusMap: Record<string, string> = {
    'scheduled': 'Start Up',
    'working_on_it': 'Working on it',
    'parts_needed': 'Parts Needed',
    'done': 'Done',
    'not_scheduled': 'Estimate',
    'archived': 'Done',
    'estimate': 'Estimate',
    'ask_vadim': 'Ask Vadim',
    'start_up': 'Start Up',
    'sent_invoice': 'SENT INVOICE',
    'warranty': 'Warranty',
    'warranty_no_charge': 'Warranty/No Charge',
    'completed': 'Done'
  }
  
  return statusMap[jobStatus] || 'Start Up'
}
