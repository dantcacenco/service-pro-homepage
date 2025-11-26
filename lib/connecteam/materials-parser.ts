/**
 * ConnectTeam Materials Parser
 * 
 * Parses "Parts/materials needed" text field from form submissions
 * Handles multiple formats: comma-separated, newline-separated, bullets
 */

export interface MaterialItem {
  description: string;
  quantity?: string;
  order: number; // Position in original list
}

export interface ParseResult {
  items: MaterialItem[];
  rawText: string;
  totalItems: number;
}

/**
 * Parse materials text into structured items
 * 
 * Handles formats:
 * - Comma separated: "item1, item2, item3"
 * - Newline separated: "item1\nitem2\nitem3"
 * - Bulleted: "• item1\n• item2\n• item3"
 * - Numbered: "1. item1\n2. item2\n3. item3"
 * - Mixed: "item1, item2\n• item3"
 */
export function parseMaterials(text: string): ParseResult {
  if (!text || typeof text !== 'string') {
    return {
      items: [],
      rawText: '',
      totalItems: 0,
    };
  }

  const rawText = text.trim();
  
  // Split by multiple delimiters
  // Regex: split on newlines, bullets, dashes, numbers with periods
  const items = rawText
    .split(/[\n,•\-\*]|(?:\d+\.)/g)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .filter(item => !item.match(/^[\d\s\.\,\-\•\*]+$/)) // Remove lines with only punctuation/numbers
    .map((description, index) => {
      // Try to extract quantity if present
      const quantityMatch = description.match(/^(\d+)\s*x?\s+(.+)$/i);
      
      if (quantityMatch) {
        return {
          description: quantityMatch[2].trim(),
          quantity: quantityMatch[1],
          order: index + 1,
        };
      }
      
      return {
        description: description.trim(),
        order: index + 1,
      };
    });

  // Remove duplicates (case-insensitive)
  const uniqueItems = items.filter((item, index, self) => 
    index === self.findIndex(t => 
      t.description.toLowerCase() === item.description.toLowerCase()
    )
  );

  return {
    items: uniqueItems,
    rawText,
    totalItems: uniqueItems.length,
  };
}

/**
 * Extract quantities from materials text
 * Returns map of description -> quantity
 */
export function extractQuantities(text: string): Map<string, number> {
  const quantities = new Map<string, number>();
  const result = parseMaterials(text);
  
  result.items.forEach(item => {
    if (item.quantity) {
      const qty = parseInt(item.quantity, 10);
      if (!isNaN(qty)) {
        quantities.set(item.description, qty);
      }
    }
  });
  
  return quantities;
}

/**
 * Format materials list for display
 * Returns formatted string with bullets
 */
export function formatMaterialsList(items: MaterialItem[]): string {
  if (items.length === 0) return 'No materials needed';
  
  return items
    .map(item => {
      if (item.quantity) {
        return `• ${item.quantity}x ${item.description}`;
      }
      return `• ${item.description}`;
    })
    .join('\n');
}

/**
 * Check if materials text is empty or meaningless
 */
export function isEmptyMaterials(text: string): boolean {
  if (!text || text.trim() === '') return true;
  
  const result = parseMaterials(text);
  return result.totalItems === 0;
}

/**
 * Validate materials text
 * Returns issues if any
 */
export function validateMaterials(text: string): string[] {
  const issues: string[] = [];
  
  if (!text || text.trim() === '') {
    issues.push('Materials field is empty');
    return issues;
  }
  
  const result = parseMaterials(text);
  
  if (result.totalItems === 0) {
    issues.push('No valid materials items found');
  }
  
  // Check for very short descriptions (likely incomplete)
  const shortItems = result.items.filter(item => item.description.length < 3);
  if (shortItems.length > 0) {
    issues.push(`${shortItems.length} items have very short descriptions`);
  }
  
  // Check for suspiciously long items (might need splitting)
  const longItems = result.items.filter(item => item.description.length > 100);
  if (longItems.length > 0) {
    issues.push(`${longItems.length} items are very long (might contain multiple items)`);
  }
  
  return issues;
}

/**
 * Smart parse: tries to detect format and parse accordingly
 */
export function smartParse(text: string): ParseResult {
  if (!text || typeof text !== 'string') {
    return {
      items: [],
      rawText: '',
      totalItems: 0,
    };
  }

  const trimmed = text.trim();
  
  // Detect format
  const hasCommas = trimmed.includes(',');
  const hasNewlines = trimmed.includes('\n');
  const hasBullets = /[•\-\*]/.test(trimmed);
  const hasNumbers = /^\d+\./.test(trimmed);
  
  // Use standard parser (handles all formats)
  return parseMaterials(text);
}

/**
 * Convert materials to CSV format
 * Useful for exporting
 */
export function materialsToCSV(items: MaterialItem[]): string {
  const header = 'Order,Description,Quantity\n';
  const rows = items
    .map(item => `${item.order},"${item.description}",${item.quantity || ''}`)
    .join('\n');
  
  return header + rows;
}

/**
 * Estimate if item is a material vs labor/service
 * Simple heuristic based on keywords
 */
export function isMaterial(description: string): boolean {
  const materialKeywords = [
    'condenser', 'thermostat', 'ductwork', 'filter', 'pipe', 'tube',
    'coil', 'valve', 'wire', 'cable', 'bracket', 'screw', 'bolt',
    'refrigerant', 'insulation', 'seal', 'gasket', 'fan', 'motor',
    'compressor', 'capacitor', 'contactor', 'relay', 'switch'
  ];
  
  const lowerDesc = description.toLowerCase();
  return materialKeywords.some(keyword => lowerDesc.includes(keyword));
}
