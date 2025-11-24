/**
 * Maps friendly field names to JIRA field IDs
 * Supports both standard fields and custom fields
 */

// Standard JIRA field mappings (friendly name -> JIRA field ID)
const STANDARD_FIELD_MAP: Record<string, string> = {
  'summary': 'summary',
  'description': 'description',
  'assignee': 'assignee',
  'assigneeEmail': 'assignee',
  'issueType': 'issuetype',
  'priority': 'priority',
  'labels': 'labels',
  'components': 'components',
  'fixVersions': 'fixVersions',
  'affectsVersions': 'versions',
  'dueDate': 'duedate',
  'reporter': 'reporter',
  'reporterEmail': 'reporter',
  'environment': 'environment',
  'parent': 'parent',
  'storypoints': 'customfield_10016', // Common story points field ID (may vary by instance)
  'storyPoints': 'customfield_10016',
  'story points': 'customfield_10016',
  'points': 'customfield_10016'
};

/**
 * Maps a friendly field name to JIRA field ID
 * @param fieldName - Friendly field name (e.g., 'summary', 'assigneeEmail')
 * @returns JIRA field ID (e.g., 'summary', 'assignee')
 */
export function mapFieldNameToId(fieldName: string): string {
  const normalized = fieldName.toLowerCase().trim();
  
  // Check standard field map
  if (STANDARD_FIELD_MAP[normalized]) {
    return STANDARD_FIELD_MAP[normalized];
  }
  
  // If it's already a JIRA field ID (starts with customfield_ or is a known field), return as-is
  if (fieldName.startsWith('customfield_') || STANDARD_FIELD_MAP[fieldName]) {
    return fieldName;
  }
  
  // Return as-is (might be a custom field name that needs to be resolved)
  return fieldName;
}

/**
 * Formats a field value for JIRA API based on field type
 * @param fieldId - JIRA field ID
 * @param value - Field value to format
 * @returns Formatted value for JIRA API
 */
export function formatFieldValue(fieldId: string, value: any): any {
  // Handle assignee field (can be email or accountId)
  if (fieldId === 'assignee') {
    if (typeof value === 'string' && value.includes('@')) {
      // Email address
      return { emailAddress: value };
    } else if (typeof value === 'string') {
      // Account ID
      return { accountId: value };
    } else if (value && typeof value === 'object' && value.emailAddress) {
      // Already formatted
      return value;
    } else if (value === null || value === '') {
      // Unassign
      return null;
    }
  }
  
  // Handle reporter field (same as assignee)
  if (fieldId === 'reporter') {
    if (typeof value === 'string' && value.includes('@')) {
      return { emailAddress: value };
    } else if (typeof value === 'string') {
      return { accountId: value };
    } else if (value && typeof value === 'object' && value.emailAddress) {
      return value;
    } else if (value === null || value === '') {
      return null;
    }
  }
  
  // Handle issue type
  if (fieldId === 'issuetype') {
    if (typeof value === 'string') {
      return { name: value };
    } else if (value && typeof value === 'object' && value.name) {
      return value;
    }
  }
  
  // Handle priority
  if (fieldId === 'priority') {
    if (typeof value === 'string') {
      return { name: value };
    } else if (value && typeof value === 'object' && value.name) {
      return value;
    }
  }
  
  // Handle project
  if (fieldId === 'project') {
    if (typeof value === 'string') {
      return { key: value };
    } else if (value && typeof value === 'object' && value.key) {
      return value;
    }
  }
  
  // Handle components (array of component names or objects)
  if (fieldId === 'components') {
    if (Array.isArray(value)) {
      return value.map(comp => {
        if (typeof comp === 'string') {
          return { name: comp };
        }
        return comp;
      });
    }
  }
  
  // Handle fixVersions and affectsVersions
  if (fieldId === 'fixVersions' || fieldId === 'versions') {
    if (Array.isArray(value)) {
      return value.map(version => {
        if (typeof version === 'string') {
          return { name: version };
        }
        return version;
      });
    }
  }
  
  // Handle labels (array of strings)
  if (fieldId === 'labels') {
    if (Array.isArray(value)) {
      return value;
    } else if (typeof value === 'string') {
      return [value];
    }
  }
  
  // Handle description - should be converted to ADF if it's a string
  // (This will be handled separately in the update function)
  
  // For all other fields, return as-is
  return value;
}

/**
 * Checks if a field requires special formatting (like description for ADF)
 */
export function requiresSpecialFormatting(fieldId: string): boolean {
  return fieldId === 'description';
}

