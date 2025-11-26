// Professional HVAC Proposal PDF Generator
// Clean, simple format similar to industry-standard proposals

import jsPDF from 'jspdf';
import { COMPANY_INFO } from '@/lib/legal-disclaimers';

interface ProposalData {
  proposal_number: string;
  title: string;
  description?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
  approved_at?: string;
  valid_until?: string | null;
  customers: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  proposal_items: Array<{
    name: string;
    description: string;
    price: number;
    unit_price: number;
    quantity: number;
    is_addon: boolean;
    is_selected?: boolean;
    total_price?: number;
  }>;
  // Multi-tier support
  tier_mode?: string;
  selectedTier?: {
    tierName: string;
    tierLevel: number;
  };
}

// Helper function to group duplicate items
function groupDuplicateItems(items: any[]): Array<{ 
  name: string; 
  count: number; 
  totalPrice: number; 
}> {
  const grouped = new Map<string, { name: string; count: number; totalPrice: number }>();
  
  items.forEach(item => {
    const key = item.name;
    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.count += 1;
      existing.totalPrice += item.total_price || item.price || 0;
    } else {
      grouped.set(key, {
        name: item.name,
        count: 1,
        totalPrice: item.total_price || item.price || 0
      });
    }
  });
  
  return Array.from(grouped.values());
}

export async function generateProposalPDF(proposal: ProposalData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper: Check if new page needed (with buffer to avoid breaking sections)
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin - 10) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper: Draw horizontal line separator
  const drawSeparatorLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  };

  // ============================================================
  // HEADER: Company Name + License
  // ============================================================
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(COMPANY_INFO.businessName, margin, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`NC License #${COMPANY_INFO.licenseNumber}`, margin, 28);
  
  // Proposal number on right - moved down to prevent overlap
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Proposal #${proposal.proposal_number}`, pageWidth - margin, 24, { align: 'right' });
  
  // Date on right
  const dateStr = new Date(proposal.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, pageWidth - margin, 32, { align: 'right' });
  
  yPos = 50;

  // ============================================================
  // SECTION 1: CUSTOMER INFORMATION
  // ============================================================
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Customer Information', margin, yPos);
  yPos += 8;

  drawSeparatorLine();

  // Customer details in simple format
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(proposal.customers.name, margin + 30, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Email:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(proposal.customers.email, margin + 30, yPos);
  yPos += 6;
  
  if (proposal.customers.phone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(proposal.customers.phone, margin + 30, yPos);
    yPos += 6;
  }
  
  if (proposal.customers.address) {
    doc.setFont('helvetica', 'bold');
    doc.text('Service Address:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(proposal.customers.address, contentWidth - 35);
    doc.text(addressLines, margin + 30, yPos);
    yPos += addressLines.length * 5 + 2;
  }
  
  yPos += 6;

  // ============================================================
  // SECTION 2: APPROVED PACKAGE (if approved)
  // ============================================================
  checkNewPage(60);
  
  // If proposal is approved, show approved badge
  if (proposal.approved_at) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74); // Green-600
    doc.text('✓APPROVED PACKAGE', margin, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    const approvedDate = new Date(proposal.approved_at).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    doc.text(`Approved on ${approvedDate}`, margin, yPos + 6);
    yPos += 14;
  } else {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Proposed Services', margin, yPos);
    yPos += 8;
  }

  drawSeparatorLine();

  // Package name if multi-tier
  if (proposal.tier_mode === 'multi' && proposal.selectedTier) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(proposal.selectedTier.tierName.toUpperCase(), margin, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Tier ${proposal.selectedTier.tierLevel}`, margin, yPos + 6);
    yPos += 14;
  }

  // Services header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Included Services:', margin, yPos);
  yPos += 8;

  // Group services and display with count badges
  const services = proposal.proposal_items.filter(item => !item.is_addon);
  const groupedServices = groupDuplicateItems(services);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  groupedServices.forEach((service) => {
    checkNewPage(10);
    
    doc.setFont('helvetica', 'normal');
    
    // Service name with count badge
    let serviceLine = service.name;
    if (service.count > 1) {
      serviceLine += ` (×${service.count})`;
    }
    
    // Calculate price width to reserve space
    const priceText = `$${service.totalPrice.toFixed(2)}`;
    doc.setFont('helvetica', 'bold');
    const priceWidth = doc.getTextWidth(priceText);
    
    // Wrap service name with reserved space for price (add 15 for spacing)
    doc.setFont('helvetica', 'normal');
    const maxServiceWidth = contentWidth - priceWidth - 15;
    const serviceText = doc.splitTextToSize(serviceLine, maxServiceWidth);
    
    // Render service name
    doc.text(serviceText, margin + 3, yPos);
    
    // Render price on the LAST line of service text (not first)
    const priceYPos = yPos + ((serviceText.length - 1) * 5);
    doc.setFont('helvetica', 'bold');
    doc.text(priceText, pageWidth - margin, priceYPos, { align: 'right' });
    
    // Move yPos past all lines
    yPos += serviceText.length * 5 + 2;
  });

  yPos += 6;

  // ============================================================
  // SECTION 3: COST SUMMARY
  // ============================================================
  checkNewPage(80);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Cost Summary', margin, yPos);
  yPos += 8;

  drawSeparatorLine();

  const summaryStartX = margin + 5;
  const summaryEndX = pageWidth - margin;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  // Services Total
  doc.text('Services Total:', summaryStartX, yPos);
  doc.text(`$${proposal.subtotal.toFixed(2)}`, summaryEndX, yPos, { align: 'right' });
  yPos += 6;
  
  // Subtotal
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', summaryStartX, yPos);
  doc.text(`$${proposal.subtotal.toFixed(2)}`, summaryEndX, yPos, { align: 'right' });
  yPos += 8;

  // Tax breakdown
  const NC_STATE_TAX = 0.0475;
  const countyTaxRate = proposal.tax_rate - NC_STATE_TAX;
  const stateTaxAmount = proposal.subtotal * NC_STATE_TAX;
  const countyTaxAmount = proposal.subtotal * countyTaxRate;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  
  doc.text(`County Tax (${(countyTaxRate * 100).toFixed(2)}%):`, summaryStartX + 5, yPos);
  doc.text(`$${countyTaxAmount.toFixed(2)}`, summaryEndX, yPos, { align: 'right' });
  yPos += 5;
  
  doc.text(`NC State Tax (4.75%):`, summaryStartX + 5, yPos);
  doc.text(`$${stateTaxAmount.toFixed(2)}`, summaryEndX, yPos, { align: 'right' });
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Tax (${(proposal.tax_rate * 100).toFixed(2)}%):`, summaryStartX, yPos);
  doc.text(`$${proposal.tax_amount.toFixed(2)}`, summaryEndX, yPos, { align: 'right' });
  yPos += 10;

  // Separator line before total - with proper spacing
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.8);
  doc.line(summaryStartX, yPos, summaryEndX, yPos);
  yPos += 8; // Add spacing after line before TOTAL text
  
  // TOTAL
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text('TOTAL:', summaryStartX, yPos);
  doc.text(`$${proposal.total.toFixed(2)}`, summaryEndX, yPos, { align: 'right' });
  yPos += 15;

  // ============================================================
  // SECTION 4: PAYMENT TERMS
  // ============================================================
  checkNewPage(65);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Terms', margin, yPos);
  yPos += 8;

  drawSeparatorLine();

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const deposit = proposal.total * 0.5;
  const progress = proposal.total * 0.3;
  const final = proposal.total * 0.2;
  
  const paymentLines = [
    `• 50% deposit due upon approval: $${deposit.toFixed(2)}`,
    `• 30% progress payment due after rough-in inspection: $${progress.toFixed(2)}`,
    `• 20% final payment due upon project completion: $${final.toFixed(2)}`,
    '',
    'All payments are processed securely through Bill.com'
  ];

  paymentLines.forEach(line => {
    if (line === '') {
      yPos += 3;
    } else {
      const lines = doc.splitTextToSize(line, contentWidth - 5);
      checkNewPage(lines.length * 5 + 3);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 5 + 2;
    }
  });
  
  yPos += 8;

  // ============================================================
  // SECTION 5: TERMS & CONDITIONS
  // ============================================================
  checkNewPage(100);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Terms & Conditions', margin, yPos);
  yPos += 8;

  drawSeparatorLine();

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const terms = [
    'This proposal is valid for 30 days from the date above. Prices are subject to change after the expiration date.',
    `All work performed under NC License #${COMPANY_INFO.licenseNumber} and will be completed in a professional manner according to standard industry practices.`,
    'Any alteration or deviation from specifications will be executed only upon written orders and may result in additional charges.',
    'By approving this proposal, you agree to the terms and conditions stated herein.',
    'In the event of non-payment, customer agrees to pay all collection costs including reasonable attorney fees.',
    `${COMPANY_INFO.businessName} is not responsible for damage to existing structures, landscaping, or utilities unless caused by our negligence.`,
    'Customer shall provide reasonable access to premises and utilities as required for work completion.',
    'Material substitutions may be made if specified materials are unavailable, with customer approval when possible.',
    'Permits and inspections (if required) are the responsibility of the contractor unless otherwise stated.',
    'Weather delays or unforeseen conditions may extend the project timeline. Customer will be notified of any significant delays.'
  ];

  terms.forEach((term, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${term}`, contentWidth);
    const requiredSpace = lines.length * 4 + 4;
    
    checkNewPage(requiredSpace);
    doc.text(lines, margin + 2, yPos);
    yPos += lines.length * 4 + 3;
  });

  yPos += 6;

  // ============================================================
  // SECTION 6: WARRANTY
  // ============================================================
  checkNewPage(30);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Warranty', margin, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  
  const warrantyText = 'All workmanship is guaranteed for one (1) year from the date of completion. Equipment warranties are provided by the manufacturer and may vary by product. Warranty details will be provided with equipment documentation upon installation.';
  const warrantyLines = doc.splitTextToSize(warrantyText, contentWidth);
  doc.text(warrantyLines, margin + 2, yPos);
  yPos += warrantyLines.length * 4;

  // ============================================================
  // FOOTER ON EVERY PAGE
  // ============================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(
      `${COMPANY_INFO.businessName} | NC License #${COMPANY_INFO.licenseNumber} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

// Helper to download PDF
export function downloadProposalPDF(proposal: ProposalData, filename?: string) {
  generateProposalPDF(proposal).then(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `proposal-${proposal.proposal_number}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  });
}
