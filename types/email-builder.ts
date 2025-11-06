/**
 * Email Builder Type Definitions
 *
 * Shared types for the Email Template Builder feature
 */

import { EmailTemplate } from '@/lib/email-templates';

/**
 * Template with user ranking
 */
export interface RankedTemplate extends EmailTemplate {
  rank: number;
}

/**
 * Business information collected from user
 */
export interface BusinessInfo {
  businessName: string;
  industry: string;
  email: string;
  brandColor?: string;
  logo?: File;
  industrySpecific?: IndustrySpecificOptions;
}

/**
 * Industry-specific configuration options
 */
export interface IndustrySpecificOptions {
  serviceTypes?: string[];
  emergencyService?: boolean;
  beforeAfterPhotos?: boolean;
  seasonalServices?: string[];
  installationTimeline?: string;
  energyRatings?: boolean;
  maintenancePlans?: boolean;
}

/**
 * Generated email template from AI
 */
export interface GeneratedTemplate {
  html: string;
  name: string;
  description: string;
}

/**
 * Color scheme extracted from template analysis
 */
export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

/**
 * Layout pattern extracted from template analysis
 */
export interface LayoutPattern {
  type: 'table-based' | 'single-column' | 'split' | 'grid';
  hasHeader: boolean;
  hasSidebar: boolean;
  columnCount: number;
}

/**
 * Typography settings extracted from template analysis
 */
export interface Typography {
  headingFont: string;
  bodyFont: string;
  headingSizes: string[];
  bodySize: string;
  lineHeight: string;
}

/**
 * Spacing pattern extracted from template analysis
 */
export interface SpacingPattern {
  padding: string;
  margin: string;
  cellPadding: string;
}

/**
 * Visual style extracted from template analysis
 */
export interface VisualStyle {
  overall: 'minimal' | 'bold' | 'elegant' | 'playful' | 'professional' | 'modern';
  imageUsage: 'minimal' | 'moderate' | 'heavy';
  buttonStyle: 'rounded' | 'square' | 'pill' | 'outlined';
  borders: 'none' | 'subtle' | 'bold';
}

/**
 * Complete template analysis result
 */
export interface TemplateAnalysis {
  colorSchemes: ColorScheme[];
  layoutPatterns: LayoutPattern[];
  typography: Typography;
  spacingPatterns: SpacingPattern;
  visualStyle: VisualStyle;
}

/**
 * API Request: Generate Templates
 */
export interface GenerateTemplatesRequest {
  rankedTemplates: RankedTemplate[];
  businessInfo: BusinessInfo;
}

/**
 * API Response: Generate Templates
 */
export interface GenerateTemplatesResponse {
  templates: GeneratedTemplate[];
  analysis?: {
    colorScheme: ColorScheme;
    layoutPattern: LayoutPattern;
    visualStyle: string;
  };
}

/**
 * API Request: Edit Template
 */
export interface EditTemplateRequest {
  html: string;
  editRequest: string;
}

/**
 * API Response: Edit Template
 */
export interface EditTemplateResponse {
  html: string;
  changes: string;
}

/**
 * API Request: Send Test Email
 */
export interface SendTestEmailRequest {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}

/**
 * API Response: Send Test Email
 */
export interface SendTestEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email Builder Step
 */
export type EmailBuilderStep = 'ranking' | 'business-info' | 'preview';

/**
 * View mode for template preview
 */
export type ViewMode = 'desktop' | 'mobile';

/**
 * Status message type
 */
export interface StatusMessage {
  type: 'success' | 'error' | 'info' | 'warning' | null;
  message: string;
}

/**
 * Available industries
 */
export const INDUSTRIES = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'windows-doors', label: 'Windows & Doors' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'painting', label: 'Painting' },
  { value: 'general-contractor', label: 'General Contractor' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'other', label: 'Other' },
] as const;

export type IndustryValue = typeof INDUSTRIES[number]['value'];
