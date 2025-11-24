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
 * Load field mappings from individual environment variables
 * Each field has its own variable: JIRA_FIELD_SUMMARY, JIRA_FIELD_PRIORITY, etc.
 */
function loadFieldMappingsFromEnv(): Record<string, string> {
  const mappings: Record<string, string> = {};
  
  // Map environment variable names to field names
  const envVarMap: Record<string, string[]> = {
    'JIRA_FIELD_SUMMARY': ['summary'],
    'JIRA_FIELD_DESCRIPTION': ['description'],
    'JIRA_FIELD_PRIORITY': ['priority'],
    'JIRA_FIELD_STORY_POINTS': ['storyPoints', 'storypoints', 'story points', 'story_points', 'points', 'pts'],
    'JIRA_FIELD_LABELS': ['labels', 'label']
  };

  // Load each field mapping from environment variables
  for (const [envVar, fieldNames] of Object.entries(envVarMap)) {
    const fieldId = process.env[envVar];
    if (fieldId && fieldId.trim()) {
      // Map all variations to the same field ID
      for (const fieldName of fieldNames) {
        mappings[fieldName] = fieldId.trim();
      }
    }
  }

  return mappings;
}

// Load field mappings once at module load
const ENV_FIELD_MAP = loadFieldMappingsFromEnv();

/**
 * Get the combined field mapping (standard + environment variables)
 * Environment variable mappings override standard mappings if there's a conflict
 */
function getFieldMapping(): Record<string, string> {
  return {
    ...STANDARD_FIELD_MAP,
    ...ENV_FIELD_MAP
  };
}

/**
 * Normalizes a field name for lookup (handles common variations)
 * @param fieldName - Field name to normalize
 * @returns Normalized field name
 */
function normalizeFieldName(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove spaces: "story points" -> "storypoints"
    .replace(/_/g, '')    // Remove underscores: "story_points" -> "storypoints"
    .replace(/-/g, '');   // Remove hyphens: "story-points" -> "storypoints"
}

/**
 * Maps a friendly field name to JIRA field ID
 * Supports case-insensitive matching, handles spaces/underscores/hyphens
 * @param fieldName - Friendly field name (e.g., 'summary', 'assigneeEmail', 'Story Points')
 * @returns JIRA field ID (e.g., 'summary', 'assignee', 'customfield_10016')
 */
export function mapFieldNameToId(fieldName: string): string {
  const fieldMapping = getFieldMapping();
  
  // First, try exact match (case-insensitive)
  const lowerFieldName = fieldName.toLowerCase().trim();
  if (fieldMapping[lowerFieldName]) {
    return fieldMapping[lowerFieldName];
  }
  
  // Try normalized match (handles spaces, underscores, hyphens)
  const normalized = normalizeFieldName(fieldName);
  if (fieldMapping[normalized]) {
    return fieldMapping[normalized];
  }
  
  // Try original field name (in case it's already a JIRA field ID)
  if (fieldMapping[fieldName]) {
    return fieldMapping[fieldName];
  }
  
  // If it's already a JIRA field ID (starts with customfield_ or is a known standard field), return as-is
  if (fieldName.startsWith('customfield_')) {
    return fieldName;
  }
  
  // Check if it's a standard field ID (not in mapping but known)
  const standardFieldIds = ['summary', 'description', 'assignee', 'issuetype', 'priority', 
                            'labels', 'components', 'fixVersions', 'versions', 'duedate', 
                            'reporter', 'environment', 'parent'];
  if (standardFieldIds.includes(lowerFieldName)) {
    return lowerFieldName;
  }
  
  // Return as-is (might be a custom field name that needs to be resolved, or invalid)
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


