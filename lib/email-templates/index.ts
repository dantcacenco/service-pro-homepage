import { template01 } from './template-01-measurements-report';
import { template02 } from './template-02-minimalist-modern';
import { template03 } from './template-03-hvac-summer-promo';
import { template04 } from './template-04-before-after-showcase';
import { template05 } from './template-05-project-update';
import { template06 } from './template-06-premium-dark';
import { template07 } from './template-07-lawn-care-friendly';
import { template08 } from './template-08-luxury-remodeling';
import { template09 } from './template-09-newsletter-monthly';
import { template10 } from './template-10-seasonal-discount';
import { template11 } from './template-11-appointment-reminder';
import { template12 } from './template-12-invoice-estimate';
import { template13 } from './template-13-review-request';
import { template14 } from './template-14-referral-program';
import { template15 } from './template-15-emergency-service';
import { template16 } from './template-16-completion-thank-you';
import { template17 } from './template-17-maintenance-checklist';
import { template18 } from './template-18-quote-followup';
import { template19 } from './template-19-welcome-customer';
import { template20 } from './template-20-service-reminder';

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  html: string;
}

export const allTemplates: EmailTemplate[] = [
  template01,
  template02,
  template03,
  template04,
  template05,
  template06,
  template07,
  template08,
  template09,
  template10,
  template11,
  template12,
  template13,
  template14,
  template15,
  template16,
  template17,
  template18,
  template19,
  template20,
];

export const getTemplateById = (id: string): EmailTemplate | undefined => {
  return allTemplates.find((template) => template.id === id);
};

export const getTemplatesByCategory = (category: string): EmailTemplate[] => {
  return allTemplates.filter((template) => template.category === category);
};
