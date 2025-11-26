// Legal Disclaimers and Terms for Service Pro HVAC
// These appear on proposals, invoices, and emails

export const COMPANY_INFO = {
  licenseNumber: '34182',
  businessName: 'Fair Air Heating & Cooling',
  state: 'NC',
};

export const PROPOSAL_DISCLAIMERS = {
  header: {
    licenseInfo: `Licensed HVAC Contractor | NC License #${COMPANY_INFO.licenseNumber}`,
    proposalDate: (date: Date) => `Proposal Date: ${date.toLocaleDateString()}`,
    expirationDate: (date: Date) => `Valid Until: ${date.toLocaleDateString()}`,
    expirationDays: 30, // Proposals expire after 30 days
  },
  
  footer: {
    standard: [
      `This proposal is valid for ${30} days from the date above.`,
      `Prices are subject to change after the expiration date.`,
      `Payment terms: 50% deposit upon approval, 30% after rough-in, 20% upon completion.`,
      `All work performed under NC License #${COMPANY_INFO.licenseNumber}.`,
    ],
    
    serviceDisclaimer: [
      'This is an estimate for diagnostic and repair services.',
      'Final cost may vary based on actual time and materials required.',
      'Additional repairs discovered during service will be quoted separately.',
      'Customer will be notified of any changes before additional work proceeds.',
    ],
    
    legalTerms: [
      'By approving this proposal, you agree to the terms and conditions stated herein.',
      'In the event of non-payment, customer agrees to pay all collection costs including reasonable attorney fees.',
      'Any alteration or deviation from specifications will be executed upon written order and will become an extra charge.',
      'Owner to carry fire, tornado, and other necessary insurance.',
      `${COMPANY_INFO.businessName} is not responsible for damage to existing structures or landscaping unless caused by negligence.`,
    ],
  },
};

export const INVOICE_DISCLAIMERS = {
  header: {
    licenseInfo: `NC License #${COMPANY_INFO.licenseNumber}`,
    invoiceTerms: 'Payment Due Upon Receipt',
    invoiceType: (type: 'deposit' | 'progress' | 'final') => {
      const types = {
        deposit: '50% Deposit Invoice',
        progress: 'Progress Payment Invoice',
        final: 'Final Payment Invoice',
      };
      return types[type] || 'Invoice';
    },
  },
  
  footer: {
    paymentTerms: [
      'Payment is due upon receipt of this invoice.',
      'Accounts not paid within 30 days are subject to a 1.5% monthly finance charge.',
      'Please include invoice number with payment.',
    ],
    
    legalNotice: [
      `All work performed under NC License #${COMPANY_INFO.licenseNumber}.`,
      'In the event of non-payment, customer agrees to pay all collection costs including reasonable attorney fees.',
      'A mechanic\'s lien may be filed for unpaid balances after 30 days.',
    ],
  },
};

export const EMAIL_DISCLAIMERS = {
  proposalEmail: {
    signature: `
Thank you for choosing ${COMPANY_INFO.businessName}!

${COMPANY_INFO.businessName}
Licensed HVAC Contractor
NC License #${COMPANY_INFO.licenseNumber}
    `.trim(),
  },
  
  maintenanceReminder: {
    signature: `
${COMPANY_INFO.businessName}
Your Trusted HVAC Partner
NC License #${COMPANY_INFO.licenseNumber}
    `.trim(),
  },
  
  invoiceEmail: {
    signature: `
${COMPANY_INFO.businessName}
NC License #${COMPANY_INFO.licenseNumber}
    `.trim(),
  },
};

// Helper function to generate proposal expiration date
export function getProposalExpirationDate(proposalDate: Date = new Date()): Date {
  const expiration = new Date(proposalDate);
  expiration.setDate(expiration.getDate() + PROPOSAL_DISCLAIMERS.header.expirationDays);
  return expiration;
}

// Helper function to check if proposal is expired
export function isProposalExpired(proposalDate: Date): boolean {
  const expirationDate = getProposalExpirationDate(proposalDate);
  return new Date() > expirationDate;
}

// Format disclaimer text for display
export function formatDisclaimerSection(disclaimers: string[]): string {
  return disclaimers.join('\n\n');
}

// Get appropriate disclaimers based on job type
export function getProposalDisclaimers(jobType: 'service' | 'installation'): string[] {
  const base = [...PROPOSAL_DISCLAIMERS.footer.standard];
  
  if (jobType === 'service') {
    base.unshift(...PROPOSAL_DISCLAIMERS.footer.serviceDisclaimer);
  }
  
  base.push(...PROPOSAL_DISCLAIMERS.footer.legalTerms);
  
  return base;
}

// React component for rendering disclaimers
export const DisclaimerSection: React.FC<{
  type: 'proposal' | 'invoice';
  jobType?: 'service' | 'installation';
  className?: string;
}> = ({ type, jobType = 'installation', className = '' }) => {
  const disclaimers = type === 'proposal' 
    ? getProposalDisclaimers(jobType)
    : [...INVOICE_DISCLAIMERS.footer.paymentTerms, ...INVOICE_DISCLAIMERS.footer.legalNotice];
  
  return (
    <div className={`text-xs text-gray-600 mt-8 pt-4 border-t ${className}`}>
      <div className="mb-2 font-semibold">
        {type === 'proposal' ? 'Terms & Conditions' : 'Payment Terms'}
      </div>
      {disclaimers.map((disclaimer, index) => (
        <p key={index} className="mb-1">
          {disclaimer}
        </p>
      ))}
    </div>
  );
};

// Print-friendly styles for disclaimers
export const printStyles = `
  @media print {
    .disclaimer-section {
      page-break-inside: avoid;
      font-size: 9pt;
      line-height: 1.2;
      color: #000;
    }
    
    .disclaimer-section p {
      margin-bottom: 0.25em;
    }
    
    .license-header {
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 0.5em;
    }
  }
`;

export default DisclaimerSection;